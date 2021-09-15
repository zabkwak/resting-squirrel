import '@babel/polyfill';

import express from 'express';
import compression from 'compression';
import bodyParser from 'body-parser';
import Err from 'smart-error';
import HttpError from 'http-smart-error';
import RouteParser from 'route-parser';
import Type, { Model } from 'runtime-type';
import path from 'path';
import fs from 'fs';
import _ from 'lodash';

import Endpoint, { Param, Field, ErrorField } from './endpoint';
import Route from './route';
import Benchmark from './benchmark';
import Response, { BaseResponse, JSONResponse, CustomResponse } from './response';
import RSError from './error';
import { RouteAuth } from './typings/enums';

import pkg from '../package.json';
import MissingApiKeyError from './error/errors/missing-api-key';
import InvalidApiKeyError from './error/errors/invalid-api-key';
import InvalidAccessTokenError from './error/errors/invalid-access-token';
import MissingAccessTokenError from './error/errors/missing-access-token';
import TimeoutError from './error/errors/timeout';
import NotFoundError from './error/errors/not-found';

const APP_PACKAGE = require(path.resolve('./package.json'));

/** @type {import('./').IAppOptions} */
const DEFAULT_OPTIONS = {
	port: 8080,
	name: 'Resting Squirrel App',
	dataKey: 'data',
	errorKey: 'error',
	log: {
		enabled: true,
		level: 'verbose',
		stack: true,
	},
	logStack: true,
	logger: ({ statusCode, method, path, spec, body, params, query, headers, took, response }) => {
		console.log(new Date(), `${statusCode} ${method} ${path} BODY: ${JSON.stringify(body)} QUERY: ${JSON.stringify(query)} HEADERS: ${JSON.stringify(headers)} TOOK: ${took} ms`);
		console.log('');
	},
	meta: {
		enabled: true,
		data: {},
	},
	requestLimit: '1mb',
	charset: 'utf-8',
	docs: {
		enabled: true,
		route: '/docs',
		auth: false,
		paramsAsArray: false,
	},
	auth: {
		key: 'x-token',
		description: null,
		validator: (key, req, res, next) => new Promise(resolve => resolve(true)),
	},
	apiKey: null,
	timeout: null,
	before: {
		'*': (req, res, next) => next(),
	},
	after: {
		'*': (err, data, req, res, next) => next(),
	},
	defaultError: {
		statusCode: 500,
		message: 'Server error',
		code: 'unknown',
	},
	validateParams: true,
	responseStrictValidation: false,
	wrapArrayResponse: false,
	errorStack: false,
};

class Application {

	/** @type {express.Express} */
	_app = null;
	/** @type {http.Server} */
	_server = null;
	/** @type {import('./').IAppOptions} */
	_options = {};

	/** @type {Object.<string, Route>} */
	_routes = {};

	_beforeExecution = [];
	_afterExecution = [];

	_apiKeyHandler = null;

	_stats = {
		error: 0,
		warning: 0,
	};

	get version() {
		return APP_PACKAGE.version;
	}

	/**
	 * 
	 * @param {import('./').IAppOptions} options 
	 */
	constructor(options = {}) {
		this._options = this._mergeObjects(options, DEFAULT_OPTIONS);
		if (typeof options.log === 'boolean') {
			this._options.log = {
				...this._mergeObjects({}, DEFAULT_OPTIONS.log),
				enabled: options.log,
			};
			this._warn('Using log option as boolean is deprecated.');
		}
		if (typeof this._options.before === 'function') {
			this._warn('Using \'before\' as a functions is deprecated');
			this._options.before = { '*': this._options.before };
		}
		if (typeof this._options.after === 'function') {
			this._warn('Using \'after\' as a functions is deprecated');
			this._options.after = { '*': this._options.after };
		}
		if (this._options.before) {
			this._warn('Using \'before\' option is deprecated');
			Object.keys(this._options.before).forEach((route) => {
				this.registerBeforeExecution(route, (req, res) => {
					return new Promise((resolve, reject) => {
						this._options.before[route](req, res, (err) => {
							if (err) {
								reject(err);
								return;
							}
							resolve();
						});
					});
				});
			});
		}
		if (this._options.after) {
			this._warn('Using \'after\' option is deprecated.');
			Object.keys(this._options.after).forEach((route) => {
				this.registerAfterExecution(route, (err, data, req, res) => {
					return new Promise((resolve, reject) => {
						this._options.after[route](err, data, req, res, (err) => {
							if (err) {
								reject(err);
								return;
							}
							resolve();
						});
					});
				});
			});
		}
		if (this._options.apiKey) {
			this._warn('Using \'apiKey\' option is deprecated.');
		}
		// Object merge cannot merge not existing keys, so this adds custom meta data to the options.
		if (options.meta && options.meta.data) {
			Object.keys(options.meta.data).forEach(k => this._options.meta.data[k] = options.meta.data[k]);
		}
		if (typeof options.auth === 'function') {
			this._warn('Using auth option as a function is deprecated.');
			this._options.auth = this._mergeObjects({}, DEFAULT_OPTIONS.auth);
			this._options.auth.validator = (key, req, res, cb) => {
				options.auth(req, res, cb);
			};
		}
		if (typeof options.logStack === 'boolean') {
			this._warn('Using logStack option is deprecated.');
			this._options.log.stack = options.logStack;
		}
		this._createApp();
		this._registerSupportRoutes();
	}

	use(route, callback) {
		if (!callback) {
			this._app.use(route);
			return;
		}
		this._app.use(route, callback);
	}

	// #region Registers

	registerApiKeyHandler(handler) {
		this._apiKeyHandler = handler;
		return this;
	}

	registerBeforeExecution(spec, callback) {
		const index = this._beforeExecution.map(({ spec }) => spec).indexOf(spec);
		if (index >= 0) {
			this._warn(`Before execution callback for '${spec}' is already registered. Rewriting.`);
			this._beforeExecution.splice(index, 1);
		}
		this._beforeExecution.push({ spec, callback });
		return this;
	}

	registerAfterExecution(spec, callback) {
		const index = this._afterExecution.map(({ spec }) => spec).indexOf(spec);
		if (index >= 0) {
			this._warn(`After execution callback for '${spec}' is already registered. Rewriting.`);
			this._afterExecution.splice(index, 1);
		}
		this._afterExecution.push({ spec, callback });
		return this;
	}

	// #endregion

	// #region HTTP methods

	/**
	 * 
	 * @param {number} version 
	 * @param {string} route 
	 * @param {import('./').IRouteOptions|boolean|function} requireAuth 
	 * @param {Param[]|function} params 
	 * @param {string|function} description 
	 * @param {function} callback 
	 */
	get(version, route, requireAuth, params, docs, callback) {
		return this.registerRoute('get', version, route, requireAuth, params, docs, callback);
	}

	/**
	 * 
	 * @param {number} version 
	 * @param {string} route 
	 * @param {import('./').IRouteOptions|boolean|function} requireAuth 
	 * @param {Param[]|function} params 
	 * @param {string|function} description 
	 * @param {function} callback 
	 */
	post(version, route, requireAuth, params, docs, callback) {
		return this.registerRoute('post', version, route, requireAuth, params, docs, callback);
	}

	/**
	 * 
	 * @param {number} version 
	 * @param {string} route 
	 * @param {import('./').IRouteOptions|boolean|function} requireAuth 
	 * @param {Param[]|function} params 
	 * @param {string|function} description 
	 * @param {function} callback 
	 */
	put(version, route, requireAuth, params, docs, callback) {
		return this.registerRoute('put', version, route, requireAuth, params, docs, callback);
	}

	/**
	 * 
	 * @param {number} version 
	 * @param {string} route 
	 * @param {import('./').IRouteOptions|boolean|function} requireAuth 
	 * @param {Param[]|function} params 
	 * @param {string|function} description 
	 * @param {function} callback 
	 */
	delete(version, route, requireAuth, params, docs, callback) {
		return this.registerRoute('delete', version, route, requireAuth, params, docs, callback);
	}

	/**
	 * 
	 * @param {number} version 
	 * @param {string} route 
	 * @param {import('./').IRouteOptions|boolean|function} requireAuth 
	 * @param {Param[]|function} params 
	 * @param {string|function} description 
	 * @param {function} callback 
	 */
	head(version, route, requireAuth, params, docs, callback) {
		return this.registerRoute('head', version, route, requireAuth, params, docs, callback);
	}

	// #endregion

	/**
	 * 
	 * @param {string} method 
	 * @param {number} version 
	 * @param {string} route 
	 * @param {import('./').IRouteOptions|boolean|function} requireAuth 
	 * @param {Param[]|function} params 
	 * @param {string|function} description 
	 * @param {function} callback 
	 */
	registerRoute(method, version, route, requireAuth, params, description, callback) {
		if (isNaN(parseFloat(version))) {
			callback = description;
			description = params;
			params = requireAuth;
			requireAuth = route;
			route = version;
			version = null;
		}
		// Mismatch for back compatibility. If the requireAuth parameter is a function it means that it's the callback and RouteOptions are empty.
		if (typeof requireAuth === 'function') {
			params = requireAuth;
			requireAuth = {};
		}
		if (typeof requireAuth === 'object') {
			// Mismatch for back compatibility. If the requireAuth parameter is an object it means that the callback is next argument (params).
			return this._registerRoute(method, version, route, {
				...requireAuth,
				timeout: requireAuth.timeout === undefined ? this._options.timeout : requireAuth.timeout,
			}, params);
		}
		this._warn('Using endpoint options as method arguments is deprecated. It will be removed in next major release.');
		if (typeof params === 'function') {
			callback = params;
			params = [];
			description = null;
		}
		if (typeof description === 'function') {
			callback = description;
			description = null;
		}
		return this._registerRoute(method, version, route, {
			requireAuth,
			params,
			description,
			timeout: this._options.timeout,
		}, callback);
	}

	/**
	 * 
	 * @param {function} cb 
	 * @deprecated
	 */
	listen(cb = () => { }) {
		this.start(cb);
	}

	/**
	 * Starts the application.
	 * @param {function} cb 
	 */
	start(cb = () => { }) {
		const { port, auth, log, errorKey, errorStack } = this._options;
		for (const route of Object.values(this._routes)) {
			for (const v of Object.keys(route.routes)) {
				const endpoint = route.routes[v];
				this._app[route.method](endpoint.getEndpoint(), async (req, res, next) => {
					req.__endpoint = endpoint;
					const b = req.__benchmark;
					let timeout;
					let timedOut = false;
					if (endpoint.timeout) {
						timeout = setTimeout(() => {
							timedOut = true;
							req.emit('timeout');
							next(new TimeoutError());
						}, endpoint.timeout);
					}
					b.mark('bootstrap');
					try {
						await this._checkApiKey(req);
						if (timedOut) {
							throw new Err('Time out', '_timeout_internal');
						}
						b.mark('api key checking');
						await this._checkAuth(req, res, endpoint.auth, auth);
						if (timedOut) {
							throw new Err('Time out', '_timeout_internal');
						}
						b.mark('auth checking');
						await this._checkArguments(endpoint.getArguments(), req);
						if (timedOut) {
							throw new Err('Time out', '_timeout_internal');
						}
						b.mark('arguments checking');
						await this._checkParams(endpoint.params, req);
						if (timedOut) {
							throw new Err('Time out', '_timeout_internal');
						}
						b.mark('params checking');
						await this._beforeCallback(req, res);
						if (timedOut) {
							throw new Err('Time out', '_timeout_internal');
						}
						b.mark('before callback executing');
						const data = await this._execute(req, res);
						if (timedOut) {
							throw new Err('Time out', '_timeout_internal');
						}
						b.mark('callback executed');
						clearTimeout(timeout);
						this._handleData(req, res, data);
					} catch (e) {
						clearTimeout(timeout);
						switch (e.code) {
							case 'ERR_NOT_FOUND':
								res.send404();
								break;
							case 'ERR__TIMEOUT_INTERNAL':
								// This does nothing. The error is sent in the setTimeout.
								break;
							default:
								next(e);
						}
						return;
					}
				});
			}
		}
		this._app.use('*', async (req, res, next) => {
			try {
				await this._checkApiKey(req);
			} catch (e) {
				next(e);
				return;
			}
			res.send404();
		});
		// TODO why the hell the next must be here if it's not needed?
		this._app.use((err, req, res, next) => {
			const b = req.__benchmark;
			if (!(err instanceof HttpError)) {
				err = HttpError.create(err.statusCode || 500, err);
			}
			this._error(`${err.message}${log.stack ? `\n${err.stack}` : ''}`);
			b.mark('error logging');
			if (req.__endpoint) {
				const errors = Object.keys(req.__endpoint.getErrors());
				if (!errors.includes(err.code)) {
					this._warn(`Error code '${err.code}' is not defined in the endpoint's error list.`);
				}
			}
			res.status(err.statusCode);
			delete err.statusCode;
			const errorData = err.toJSON(errorStack);
			if (errorData.stack) {
				errorData.stack = errorData.stack.split('\n');
			}
			res._sendData(errorData, errorKey);
		});
		this._server = this._app.listen(port, () => {
			this._log(`The application is listening on ${port}. Stats: ${JSON.stringify(this._stats)}.`);
			if (typeof cb === 'function') {
				cb(undefined, { stats: this._stats });
			}
		});
	}

	/**
	 * Stops the application.
	 * @param {function} cb 
	 */
	stop(cb = () => { }) {
		if (!this._server) {
			this._warn('Server cannot be stopped because it was not started.');
			return;
		}
		this._server.close(() => {
			this._log('The application is stopped.');
			if (typeof cb === 'function') {
				cb();
			}
		});
	}

	async docs(apiKey = null) {
		const docs = {};
		for (const route of Object.values(this._routes)) {
			for (const v of Object.keys(route.routes)) {
				const endpoint = route.routes[v];
				if (endpoint.hideDocs) {
					continue;
				}
				if (apiKey && await endpoint.isApiKeyExcluded(apiKey)) {
					continue;
				}
				docs[`${route.method.toUpperCase()} ${endpoint.getEndpoint()}`] = this._getDocsObject(endpoint);
			}
		}
		return docs;
	}

	getDocs() {
		const docs = {};
		for (const route of Object.values(this._routes)) {
			for (const v of Object.keys(route.routes)) {
				const endpoint = route.routes[v];
				if (endpoint.hideDocs) {
					continue;
				}
				docs[`${route.method.toUpperCase()} ${endpoint.getEndpoint()}`] = this._getDocsObject(endpoint);
			}
		}
		return docs;
	}

	/**
	 * 
	 * @param {string} method 
	 * @param {number} version 
	 * @param {string} route 
	 * @param {import('./').IRouteOptions} options
	 * @param {function} callback 
	 */
	_registerRoute(method, version, route, options, callback) {
		if (typeof options === 'function') {
			callback = options;
			options = {};
		}
		const key = `${method}${route}`;
		if (!this._routes[key]) {
			this._routes[key] = new Route(method, route, options.args);
		}
		if (options.response && !(options.response instanceof BaseResponse)) {
			options.response = new JSONResponse(options.response);
		}
		if (options.requireAuth !== undefined) {
			this._warn('Route option \'requireAuth\' is deprecated.');
		}
		if (options.auth === undefined) {
			options.auth = options.requireAuth ? RouteAuth.REQUIRED : RouteAuth.DISABLED;
		}
		delete options.requireAuth;
		const endpoint = new Endpoint(this._routes[key], {
			version,
			...options,
			callback,
			validateParams: this._options.validateParams,
			apiKeyEnabled: options.requireApiKey === false ? false : this._isApiKeyEnabled(),
		});
		return endpoint;
	}

	/**
	 * 
	 * @param {express.Request} req
	 * @returns {Promise<void>}
	 */
	async _checkApiKey(req) {
		if (req.__endpoint && !req.__endpoint.apiKeyEnabled) {
			return;
		}
		if (typeof this._apiKeyHandler === 'function') {
			if (!req.query.api_key) {
				throw new MissingApiKeyError();
			}
			if (!await this._apiKeyHandler(req.query.api_key, req)) {
				throw new InvalidApiKeyError();
			}
			req.apiKey = req.query.api_key;
			if (req.__endpoint && await req.__endpoint.isApiKeyExcluded(req.query.api_key)) {
				throw new NotFoundError();
			}
			return;
		}
		const { apiKey } = this._options;
		if (!apiKey || !apiKey.enabled) {
			return;
		}
		return new Promise(async (resolve, reject) => {
			let key = null;
			switch (apiKey.type) {
				case 'body':
					key = req.body.api_key;
					break;
				case 'header':
					key = req.headers.api_key;
					break;
				default:
					key = req.query.api_key;
					break;
			}
			if (!key) {
				reject(new MissingApiKeyError());
				return;
			}
			req.apiKey = key;
			if (req.__endpoint) {
				try {
					if (await req.__endpoint.isApiKeyExcluded(key)) {
						reject(new NotFoundError());
						return;
					}
				} catch (e) {
					reject(e);
					return;
				}
			}
			let executed = false;
			if (!apiKey.validator) {
				apiKey.validator = async () => true;
			}
			const p = apiKey.validator(key, (err) => {
				this._warn('Using a callback in api key validator is deprecated.');
				if (executed) {
					this._warn('Middleware executed using a Promise.');
					return;
				}
				executed = true;
				if (err) {
					reject(err);
					return;
				}
				resolve();
			});
			if (p instanceof Promise) {
				p.then((valid) => {
					if (executed) {
						this._warn('Middleware executed using a callback.');
						return;
					}
					if (typeof valid !== 'boolean') {
						this._warn('Api key validator should return Promise<boolean>.');
						return;
					}
					executed = true;
					if (!valid) {
						reject(new InvalidApiKeyError());
						return;
					}
					resolve();
				}).catch((e) => {
					executed = true;
					process.nextTick(() => reject(e));
				});
			}
		});

	}

	/**
	 * 
	 * @param {express.Request} req 
	 * @param {express.Response} res 
	 * @param {RouteAuth} routeAuth 
	 * @param {AppOptions.Auth} auth
	 * @returns {Promise<void>}
	 */
	_checkAuth(req, res, routeAuth, auth) {
		return new Promise((resolve, reject) => {
			if (!routeAuth) {
				resolve();
				return;
			}
			const { key, validator } = auth;
			if (!req.headers[key]) {
				if (routeAuth === RouteAuth.OPTIONAL) {
					resolve();
					return;
				}
				reject(new MissingAccessTokenError());
				return;
			}
			req.accessToken = req.headers[key];
			let executed = false;
			const p = validator(key, req, res, (err) => {
				this._warn('Using a callback in auth validator is deprecated.');
				if (executed) {
					this._warn('Middleware executed using a Promise.');
					return;
				}
				executed = true;
				if (err) {
					reject(err);
					return;
				}
				resolve();
			});
			if (p instanceof Promise) {
				p.then((valid) => {
					if (executed) {
						this._warn('Middleware executed using a callback.');
						return;
					}
					if (typeof valid !== 'boolean') {
						this._warn('Access token validator should return Promise<boolean>.');
						return;
					}
					executed = true;
					if (!valid) {
						reject(new InvalidAccessTokenError());
						return;
					}
					resolve();
				}).catch((e) => {
					executed = true;
					process.nextTick(() => reject(e));
				});
			}
		});
	}

	/**
	 * 
	 * @param {Object.<string, Field>} args 
	 * @param {express.Request} req 
	 * @returns {Promise<void>}
	 */
	_checkArguments(args, req) {
		return new Promise((resolve, reject) => {
			try {
				Object.keys(args).forEach((key) => {
					const arg = args[key];
					if (!arg.type.canCast(req.params[key])) {
						throw new RSError.InvalidArgumentType(key, arg.type);
					}
					req.params[key] = arg.type.cast(req.params[key]);
				});
			} catch (err) {
				reject(err);
			}
			resolve();
		});
	}

	/**
	 * 
	 * @param {Param[]} params 
	 * @param {express.Request} req
	 * @returns {Promise<void>}
	 */
	_checkParams(params, req) {
		return new Promise((resolve, reject) => {
			if (!params.length) {
				resolve();
				return;
			}
			const mergedParams = { ...req.query, ...req.body };
			const castedParams = {};
			const paramsKey = req.method === 'GET' ? 'query' : 'body';
			try {
				params.forEach((param) => {
					const p = param.name;
					if (param.required) {
						const requiredParam = req[paramsKey][p];
						if (requiredParam === null || requiredParam === undefined) {
							throw new RSError.MissingParameter(p, { parameter: p });
						}
						if (param.type.getName() === 'ArrayOf' && requiredParam instanceof Array && !requiredParam.length) {
							throw new RSError.MissingParameter(p, true, { parameter: p });
						}
					} else if (mergedParams[p] === undefined) {
						return;
					}
					try {
						castedParams[p] = param.type.cast(mergedParams[p]);
					} catch (e) {
						switch (e.code) {
							case 'ERR_INVALID_CAST':
							case 'ERR_UNSUPPORTED_OPERATION':
								throw new RSError.InvalidParameterType(
									p,
									param.type,
									{ type_error: { message: e.message, code: e.code } },
								);
							default: throw e;
						}
					}
				});
			} catch (err) {
				reject(err);
			}
			req[paramsKey] = { ...req[paramsKey], ...castedParams };
			resolve();
		});
	}

	/**
	 * 
	 * @param {express.Request} req 
	 * @param {express.Response} res
	 * @returns {Promise<void>}
	 */
	async _beforeCallback(req, res) {
		if (this._beforeExecution.length) {
			for (let i = 0; i < this._beforeExecution.length; i++) {
				const { spec, callback } = this._beforeExecution[i];
				if (spec === '*') {
					await callback(req, res);
					continue;
				}
				const r = new RouteParser(spec);
				const match = r.match(req.path);
				if (!match) {
					continue;
				}
				await callback(req, res);
			}
		}
	}

	/**
	 * 
	 * @param {express.Request} req 
	 * @param {express.Response} res 
	 * @returns {Promise<any>}
	 */
	_execute(req, res) {
		return new Promise((resolve, reject) => {
			const endpoint = req.__endpoint;
			let dataSent = false;
			const p = endpoint.callback(req, res, (err, data) => {
				this._warn('Using callbacks in the endpoint execution is deprecated. Use Promises.')
				if (dataSent) {
					this._warn('Data already sent using a Promise.');
					return;
				}
				dataSent = true;
				if (err) {
					reject(err);
					return;
				}
				resolve(data);
			});
			if (p instanceof Promise) {
				p.then((data) => {
					if (dataSent) {
						this._warn('Data already sent using a callback.');
						return;
					}
					if (data === undefined) {
						this._warn('Methods using Promises shouldn\'t return undefined.');
						return;
					}
					dataSent = true;
					resolve(data);
				}).catch((e) => {
					dataSent = true;
					reject(e); // TODO? process.nextTick
				});
			}
		});
	}

	/**
	 * Validates the data with defined response of the endpoint. After the validation the data are sent to output.
	 * @param {express.Request} req 
	 * @param {express.Response} res 
	 * @param {any} data 
	 */
	_handleData(req, res, data) {
		const { wrapArrayResponse } = this._options;
		const endpoint = req.getEndpoint();
		if (wrapArrayResponse && data instanceof Array) {
			data = {
				count: data.length,
				items: data,
			};
		}
		let responseData;
		if (endpoint.response) {
			if (!data) {
				this._warn('Endpoint has defined response data but the callback is sending undefined data.');
			} else {
				if (endpoint.response instanceof JSONResponse) {
					try {
						// convert data to json
						responseData = data.toJSON();
					} catch (e) {
						this._warn('Data do not have toJSON method.');
						// if data don't have toJSON method copy the data to new object
						responseData = {
							...data,
						};
					}
					endpoint.response.fields.forEach((field) => {
						const { type, name } = field;
						try {
							responseData[name] = type.cast(responseData[name]);
						} catch (e) {
							const message = `Response on key '${name}' has invalid type. It should be ${type}.`;
							if (this._options.responseStrictValidation) {
								throw new Err(message, 'invalid_response_cast', { type_error: e.toJSON() });
							}
							this._warn(`${message} -> ${e.message}`);
						}
					});
				}
			}
		}
		res._sendData(responseData || data);
	}

	async _afterCallback(err, data, req, res) {
		if (this._afterExecution.length) {
			for (let i = 0; i < this._afterExecution.length; i++) {
				const { spec, callback } = this._afterExecution[i];
				if (spec === '*') {
					await callback(err, data, req, res);
					continue;
				}
				const r = new RouteParser(spec);
				const match = r.match(req.path);
				if (!match) {
					continue;
				}
				await callback(err, data, req, res);
			}
		}
	}

	/**
	 * Creates the express application instance and registers middlewares.
	 */
	_createApp() {
		const {
			defaultError, dataKey, errorKey, requestLimit, meta, log, logger, name, charset
		} = this._options;
		this._app = express();

		this._app.use((req, res, next) => {
			const benchmark = new Benchmark().start();
			req.__benchmark = benchmark;
			req.getEndpoint = () => req.__endpoint;
			req.getBenchmark = () => req.__benchmark;
			res.send204 = () => {
				this._warn('res.send204 is deprecated. Use next callback in the route without data.');
				res._sendData();
			};
			res.send404 = (message = 'Page not found', code = 'page_not_found') => res.sendError(HttpError.create(404, message, code));
			res.send401 = (message, code) => res.sendError(HttpError.create(401, message, code));
			res.send501 = (message, code) => res.sendError(HttpError.create(501, message, code));
			res.addMeta = (key, value) => {
				if (!res.__meta) {
					res.__meta = {};
				}
				res.__meta[key] = value;
			};
			res.sendError = (code = defaultError.statusCode, message = defaultError.message, errorCode = defaultError.code) => {
				if (code instanceof HttpError) {
					next(code);
					return;
				}
				this._warn('res.sendError is deprecated with using status codes, message and errorCode. Use HttpError instance.');
				next(new Err(message, errorCode));
			};
			res.sendData = (data, key = dataKey) => {
				this._warn('res.sendData is deprecated. Use next callback in route or Promises.');
				res._sendData(data, key);
			};
			res.log = (response) => {
				if (log.enabled && typeof logger === 'function' && req.path !== '/ping') {
					logger({
						statusCode: res.statusCode,
						method: req.method,
						path: req.path,
						spec: req.route ? req.route.path : req.path,
						body: req.body,
						params: req.params,
						query: req.query,
						headers: req.headers,
						took: benchmark.total,
						response,
					}, req);
				}
			};
			res._sendData = async (data, key = dataKey) => {
				try {
					await this._afterCallback(key === errorKey, data, req, res);
				} catch (e) {
					process.nextTick(() => next(e));
					return;
				}
				res._end(data !== undefined && data !== null ? { [key]: data } : null);
			};
			res._end = (data) => {
				let body = req.body;
				if (JSON.stringify(body).length > 1024) {
					body = 'Body too long';
				}
				benchmark.mark('data handled');
				const took = benchmark.total;
				const endpoint = req.getEndpoint();
				let deprecated = false;
				if (data) {
					if (endpoint && endpoint.isDeprecated()) {
						deprecated = true;
						data.warning = 'This endpoint is deprecated. It can be removed in the future.';
					}
					if (meta.enabled && req.query.nometa === undefined) {
						data._meta = _.merge({
							took,
							deprecated: deprecated || undefined,
							rs: {
								version: pkg.version,
								module: `https://www.npmjs.com/package/${pkg.name}`,
							},
							request: {
								endpoint: `${req.method} ${req.path}`,
								body,
								query: req.query,
								headers: req.headers,
							},
							app: {
								name,
								version: APP_PACKAGE.version,
							},
							// benchmark,
						}, meta.data);
						if (typeof res.__meta === 'object') {
							Object.keys(res.__meta).forEach(key => data._meta[key] = res.__meta[key]);
						}
					}
					// res.header('Content-Type', `application/json; charset=${charset}`);
					// TODO check in what cases isn't endpoint set
					const response = endpoint && endpoint.response
						? data[errorKey] ? new JSONResponse() : endpoint.response
						: new JSONResponse();
					res.header('Content-Type', response.getContentType(charset));
					const responseHeaders = response.getHeaders() || {};
					Object.keys(responseHeaders).forEach((key) => {
						res.header(key, responseHeaders[key]);
					});
					// const json = JSON.stringify(data, null, req.query.pretty === undefined ? 0 : 4);
					res.write(response.getData(data, req.query.pretty));
				} else {
					res.status(204);
				}
				res.end();
				res.log(data);
			};
			next();
		});
		this._app.use(
			compression(),
			bodyParser.json({ limit: requestLimit }),
		);
	}

	/**
	 * Registers the /favicion.ico, /ping and /docs* routes.
	 */
	_registerSupportRoutes() {
		const { docs, name, charset } = this._options;
		this.use('/favicon.ico', (req, res) => {
			res.status(204);
			res.end();
		});
		this.get('/ping', { hideDocs: true }, (req, res, next) => next(null, 'pong'));
		if (docs.enabled) {
			let requireAuth = false;
			if (docs.auth) {
				this._warn('Using auth on docs is deprecated. Use api key and its validation instead.');
				requireAuth = true;
			}
			this.get(docs.route, {
				requireAuth,
				description: 'Documentation of this API.',
				hideDocs: true,
			}, ({ apiKey }) => this.docs(apiKey));
			this.get(`${docs.route}-legacy.html`, {
				requireAuth,
				hideDocs: true,
				response: new CustomResponse(`text/html; charset=${charset}`),
			}, (req, res, next) => {
				fs.readFile(path.resolve(__dirname, '../assets/docs-legacy.html'), (err, buffer) => {
					if (err) {
						next(err);
						return;
					}
					let html = buffer.toString();
					const vars = {
						name,
						apiKey: this._isApiKeyEnabled() ? req.query.api_key : '',
						rsVersion: pkg.version,
						version: APP_PACKAGE.version,
						dataKey: this._options.dataKey,
						errorKey: this._options.errorKey,
						meta: this._options.meta.enabled,
						authKey: this._options.auth.key,
						authDescription: this._options.auth.description || '',
						docsRoute: this._options.docs.route,
					};
					Object.keys(vars).forEach((key) => {
						const r = new RegExp(`\\$\\{${key}\\}`, 'g');
						html = html.replace(r, vars[key]);
					});
					next(null, html);
				});
			});
			this.get(`${docs.route}.html`, {
				requireAuth,
				hideDocs: true,
				response: new CustomResponse(`text/html; charset=${charset}`),
			}, (req, res, next) => {
				fs.readFile(path.resolve(__dirname, '../assets/docs.html'), (err, buffer) => {
					if (err) {
						next(err);
						return;
					}
					let html = buffer.toString();
					const vars = {
						name,
						apiKey: this._isApiKeyEnabled() ? req.query.api_key : '',
						data: JSON.stringify({
							name,
							apiKey: this._isApiKeyEnabled() ? req.query.api_key : null,
							rsVersion: pkg.version,
							version: APP_PACKAGE.version,
							dataKey: this._options.dataKey,
							errorKey: this._options.errorKey,
							meta: this._options.meta.enabled,
							authKey: this._options.auth.key,
							authDescription: this._options.auth.description || '',
							docsRoute: this._options.docs.route,
						}),
					};
					Object.keys(vars).forEach((key) => {
						const r = new RegExp(`\\$\\{${key}\\}`, 'g');
						html = html.replace(r, vars[key]);
					});
					next(null, html);
				});
			});
			this.get(`${docs.route}.js`, {
				hideDocs: true,
				response: new CustomResponse(`text/javascript; charset=${charset}`),
			}, (req, res, next) => {
				fs.readFile(path.resolve(__dirname, '../assets/docs.js'), next);
			});
			this.get('/bundle.js', {
				hideDocs: true,
				response: new CustomResponse(`text/javascript; charset=${charset}`),
			}, (req, res, next) => {
				fs.readFile(path.resolve(__dirname, '../assets/bundle.js'), next);
			});
			this.get(`${docs.route}.css`, {
				hideDocs: true,
				response: new CustomResponse(`text/css; charset=${charset}`),
			}, (req, res, next) => {
				fs.readFile(path.resolve(__dirname, '../assets/docs.css'), next);
			});
		}
	}

	/**
	 * 
	 * @param {Endpoint} endpoint 
	 */
	_getDocsObject(endpoint) {
		return {
			docs: endpoint.docs,
			description: endpoint.description,
			args: endpoint.getArguments(),
			params: endpoint.getParams(this._options.docs.paramsAsArray),
			required_params: endpoint.requiredParams,
			required_auth: endpoint.requiredAuth,
			auth: endpoint.getAuth(),
			response: endpoint.getResponse(),
			response_type: endpoint.getResponseType(this._options.charset),
			errors: endpoint.getErrors(),
			deprecated: endpoint.isDeprecated(),
		};
	}

	_mergeObjects(o1, o2, strict = true) {
		const o = {};
		if (!strict) {
			Object.keys(o1).forEach((k) => {
				if (o2[k] === undefined) {
					o[k] = o1[k];
				}
			});
		}
		Object.keys(o2).forEach((k) => {
			const v = o2[k];
			if (o1[k] === undefined) {
				o[k] = v;
				return;
			}
			if (typeof v !== 'object' || v === null) {
				o[k] = o1[k];
				return;
			}
			o[k] = this._mergeObjects(o1[k], v, ['before', 'after'].indexOf(k) < 0);
		});
		return o;
	}

	_isApiKeyEnabled() {
		const { apiKey } = this._options;
		if (typeof this._apiKeyHandler === 'function') {
			return true;
		}
		return apiKey && apiKey.enabled;
	}

	_log(message) {
		const { enabled, level } = this._options.log;
		if (enabled && ['verbose'].includes(level)) {
			console.log(new Date(), message);
		}
	}

	_warn(message) {
		const { enabled, level } = this._options.log;
		if (enabled && ['warn', 'verbose'].includes(level)) {
			console.warn(new Date(), message);
		}
		this._stats.warning++;
	}

	_error(message) {
		const { enabled, level } = this._options.log;
		if (enabled && ['error', 'warn', 'verbose'].includes(level)) {
			console.error(new Date(), message);
		}
		this._stats.error++;
	}
}

/**
 * 
 * @param {import('./').IAppOptions} options 
 * @deprecated
 */
const m = (options = {}) => new Application(options);

export {
	m as default,
	Application,
	HttpError,
	Endpoint,
	Err as Error,
	Param,
	Type,
	Model as TypeModel,
	Field,
	ErrorField,
	Response,
	RouteAuth,
	RSError,
};
