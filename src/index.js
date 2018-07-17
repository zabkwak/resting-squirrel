import 'babel-polyfill';

import express from 'express';
import compression from 'compression';
import bodyParser from 'body-parser';
import Err from 'smart-error';
import HttpError from 'http-smart-error';
import RouteParser from 'route-parser';
import async from 'async';
import Type from 'runtime-type';
import path from 'path';
import fs from 'fs';

import Endpoint, { Param, Field, Error as ErrorField } from './endpoint';
import Route from './route';

import pkg from '../package.json';

const APP_PACKAGE = require(path.resolve('./package.json'));

/**
 * @typedef AppOptions
 * @property {number} port
 * @property {string} name
 * @property {string} dataKey
 * @property {string} errorKey
 * @property {boolean} log
 * @property {boolean} logStack
 * @property {function} logger
 * @property {AppOptions.Meta} meta
 * @property {string} requestLimit
 * @property {AppOptions.Docs} docs
 * @property {AppOptions.Auth} auth
 * @property {AppOptions.ApiKey} apiKey
 * @property {Object.<string, function>} before
 * @property {Object.<string, function>} after
 * @property {AppOptions.Error} defaultError
 * @property {boolean} validateParams
 * @property {boolean} responseStrictValidation
 */
/**
 * @typedef AppOptions.Error
 * @property {number} statusCode
 * @property {string} message
 * @property {string} code
 */
/**
 * @typedef AppOptions.Meta
 * @property {boolean} enabled
 * @property {Object.<string, any>} data
 */
/**
 * @typedef AppOptions.Docs
 * @property {boolean} enabled
 * @property {string} route
 * @property {boolean} auth DEPRECATED
 * @property {boolean} paramsAsArray
 */
/**
 * @typedef AppOptions.ApiKey
 * @property {boolean} enabled
 * @property {'qs'|'body'|'header'} type
 * @property {function} validator
 */
/**
 * @typedef AppOptions.Auth
 * @property {string} key
 * @property {string} description
 * @property {function} validator
 */
/**
 * @typedef RouteOptions
 * @property {boolean} requireAuth
 * @property {Param[]|string[]} params
 * @property {Field[]} response
 * @property {string[]|ErrorField[]} errors
 * @property {string} description
 * @property {boolean} hideDocs
 * @property {Field[]} args
 */

/** @type {AppOptions} */
const DEFAULT_OPTIONS = {
    port: 8080,
    name: 'Resting Squirrel App',
    dataKey: 'data',
    errorKey: 'error',
    log: true,
    logStack: true,
    logger: ({ statusCode, method, path, spec, body, params, query, headers, took }) => {
        console.log(new Date(), `${statusCode} ${method} ${path} BODY: ${JSON.stringify(body)} QUERY: ${JSON.stringify(query)} HEADERS: ${JSON.stringify(headers)} TOOK: ${took} ms`);
        console.log('');
    },
    meta: {
        enabled: true,
        data: {},
    },
    requestLimit: '1mb',
    docs: {
        enabled: true,
        route: '/docs',
        auth: false,
        paramsAsArray: false,
    },
    auth: {
        key: 'x-token',
        description: null,
        validator: (key, req, res, next) => {
            next();
        },
    },
    apiKey: {
        enabled: false,
        type: 'qs',
        validator: (apiKey, next) => next(),
    },
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
};

class Application {

    _app = null;
    /** @type {AppOptions} */
    _options = {};

    /** @type {Object.<string, Route>} */
    _routes = {};

    /**
     * 
     * @param {AppOptions} options 
     */
    constructor(options) {
        if (typeof options.before === 'function') {
            console.warn('Using \'before\' as a functions is deprecated');
            options.before = { '*': options.before };
        }
        if (typeof options.after === 'function') {
            console.warn('Using \'after\' as a functions is deprecated');
            options.after = { '*': options.after };
        }
        this._options = this._mergeObjects(options, DEFAULT_OPTIONS);
        // Object merge cannot merge not existing keys, so this adds custom meta data to the options.
        if (options.meta && options.meta.data) {
            Object.keys(options.meta.data).forEach(k => this._options.meta.data[k] = options.meta.data[k]);
        }
        if (typeof options.auth === 'function') {
            console.warn('Using auth option as a function is deprecated.');
            this._options.auth = this._mergeObjects({}, DEFAULT_OPTIONS.auth);
            this._options.auth.validator = (key, req, res, cb) => {
                options.auth(req, res, cb);
            };
        }
        this._createApp();
    }

    use(route, callback) {
        if (!callback) {
            this._app.use(route);
            return;
        }
        this._app.use(route, callback);
    }

    /**
     * 
     * @param {number} version 
     * @param {string} route 
     * @param {RouteOptions|boolean|function} requireAuth 
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
     * @param {RouteOptions|boolean|function} requireAuth 
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
     * @param {RouteOptions|boolean|function} requireAuth 
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
     * @param {RouteOptions|boolean|function} requireAuth 
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
     * @param {RouteOptions|boolean|function} requireAuth 
     * @param {Param[]|function} params 
     * @param {string|function} description 
     * @param {function} callback 
     */
    head(version, route, requireAuth, params, docs, callback) {
        return this.registerRoute('head', version, route, requireAuth, params, docs, callback);
    }

    /**
     * 
     * @param {string} method 
     * @param {number} version 
     * @param {string} route 
     * @param {RouteOptions|boolean|function} requireAuth 
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
            return this._registerRoute(method, version, route, requireAuth, params);
        }
        console.warn('Using endpoint options as method arguments is deprecated. It will be removed in next major release.');
        if (typeof params === 'function') {
            callback = params;
            params = [];
            description = null;
        }
        if (typeof description === 'function') {
            callback = description;
            description = null;
        }
        return this._registerRoute(method, version, route, { requireAuth, params, description }, callback);
    }

    /**
     * 
     * @param {function} cb 
     * @deprecated
     */
    listen(cb = () => { }) {
        this.start(cb);
    }

    start(cb = () => { }) {
        const { port, auth, before, log, logStack, errorKey } = this._options;
        Object.keys(this._routes).forEach((key) => {
            const route = this._routes[key];
            Object.keys(route.routes).forEach((v) => {
                const endpoint = route.routes[v];
                this._app[route.method](endpoint.getEndpoint(), (req, res, next) => {
                    req.__endpoint = endpoint;
                    this._checkApiKey(req, res, (err) => {
                        if (err) {
                            next(err);
                            return;
                        }
                        this._checkAuth(req, res, endpoint.requiredAuth, auth, (err) => {
                            if (err) {
                                next(err);
                                return;
                            }
                            this._checkArguments(endpoint.getRouteArguments(), req, res, (err) => {
                                if (err) {
                                    next(err);
                                    return;
                                }
                                this._checkParams(endpoint.params, req, res, (err) => {
                                    if (err) {
                                        next(err);
                                        return;
                                    }
                                    this._beforeCallback(req, res, before, async (err) => {
                                        if (err) {
                                            next(err);
                                            return;
                                        }
                                        try {
                                            await endpoint.callback(req, res, (err, data) => {
                                                if (err) {
                                                    next(err);
                                                    return;
                                                }
                                                if (endpoint.response) {
                                                    if (!data) {
                                                        console.warn('Endpoint has defined response data but the callback is not sending undefined data.');
                                                    } else {
                                                        endpoint.response.forEach((field) => {
                                                            const { type, name } = field;
                                                            if (type.isValid(data[name])) {
                                                                data[name] = type.cast(data[name]);
                                                            } else {
                                                                const message = `Response on key '${name}' has invalid type. It should be ${type}`;
                                                                if (this._options.responseStrictValidation) {
                                                                    throw new Err(message);
                                                                }
                                                                console.warn(message);
                                                            }
                                                        });
                                                    }
                                                }
                                                res._sendData(data);
                                            });
                                        } catch (e) {
                                            next(e);
                                        }
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
        this._app.use('*', (req, res, next) => res.send404());
        this._app.use((err, req, res, next) => {
            if (!(err instanceof HttpError)) {
                err = HttpError.create(500, err);
            }
            if (log) {
                console.error(err.message);
                if (logStack) {
                    console.error(err.stack);
                }
            }
            if (req.__endpoint) {
                const errors = Object.keys(req.__endpoint.getErrors());
                if (!errors.includes(err.code)) {
                    console.warn(`Error code '${err.code}' is not defined in the endpoint's error list.`);
                }
            }
            res.status(err.statusCode);
            delete err.statusCode;
            res._sendData(err.toJSON(), errorKey);
        });
        this._app.listen(port, () => {
            this._log(`The application is listening on ${port}`);
            cb();
        });
    }

    docs() {
        const docs = {};
        Object.keys(this._routes).forEach((key) => {
            const route = this._routes[key];
            Object.keys(route.routes).forEach((v) => {
                const endpoint = route.routes[v];
                if (endpoint.hideDocs) {
                    return;
                }
                docs[`${route.method.toUpperCase()} ${endpoint.getEndpoint()}`] = {
                    docs: endpoint.docs,
                    description: endpoint.description,
                    args: endpoint.getRouteArguments(),
                    params: endpoint.getParams(this._options.docs.paramsAsArray),
                    required_params: endpoint.requiredParams,
                    required_auth: endpoint.requiredAuth,
                    response: endpoint.getResponse(),
                    errors: endpoint.getErrors(),
                    deprecated: endpoint.isDeprecated(),
                };
            });
        });
        return docs;
    }

    /**
     * 
     * @param {string} method 
     * @param {number} version 
     * @param {string} route 
     * @param {RouteOptions} options
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
        const endpoint = new Endpoint(this._routes[key], {
            version,
            ...options,
            callback,
            validateParams: this._options.validateParams,
            apiKeyEnabled: this._options.apiKey.enabled,
        });
        return endpoint;
    }

    _checkApiKey(req, res, next) {
        const { apiKey } = this._options;
        if (!apiKey.enabled) {
            next();
            return;
        }
        let key = null;
        switch (apiKey.type) {
            case 'qs':
                key = req.query.api_key;
                break;
            case 'body':
                key = req.body.api_key;
                break;
            case 'header':
                key = req.headers.api_key;
                break;
        }
        if (!key) {
            next(HttpError.create(403, 'Api key is missing.', 'missing_api_key'));
            return;
        }
        apiKey.validator(key, next);
    }

    /**
     * 
     * @param {*} req 
     * @param {*} res 
     * @param {*} requiredAuth 
     * @param {AppOptions.Auth} auth 
     * @param {*} cb 
     */
    _checkAuth(req, res, requiredAuth, auth, cb) {
        if (!requiredAuth) {
            cb();
            return;
        }
        const { key, validator } = auth;
        if (!req.headers[key]) {
            cb(HttpError.create(401, 'The access token is missing.', 'missing_access_token'));
            return;
        }
        if (typeof validator === 'function') {
            validator(key, req, res, cb);
        }
    }

    /**
     * 
     * @param {Object.<string, Field>} args 
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    _checkArguments(args, req, res, next) {
        try {
            Object.keys(args).forEach((key) => {
                const arg = args[key];
                if (!arg.type.isValid(req.params[key])) {
                    throw HttpError.create(400, `Argument '${key}' has invalid type. It should be '${arg.type}'.`, 'invalid_type');
                }
                req.params[key] = arg.type.cast(req.params[key]);
            });
        } catch (err) {
            if (err.code === 'ERR_INVALID_TYPE') {
                next(err);
                return;
            }
            throw err;
        }
        next();
    }

    /**
     * 
     * @param {Param[]} params 
     * @param {*} req 
     * @param {*} res 
     * @param {function} next 
     */
    _checkParams(params, req, res, next) {
        if (!params.length) {
            next();
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
                        throw HttpError.create(400, `Parameter '${p}' is missing.`, 'missing_parameter');
                    }
                    if (param.type.getName() === 'ArrayOf' && requiredParam instanceof Array && !requiredParam.length) {
                        throw HttpError.create(400, `Parameter '${p}' cannot be an empty array.`, 'missing_parameter');
                    }
                } else if (mergedParams[p] === undefined) {
                    return;
                }
                if (!param.type.isValid(mergedParams[p])) {
                    throw HttpError.create(400, `Parameter '${p}' has invalid type. It should be '${param.type}'.`, 'invalid_type');
                } else {
                    castedParams[p] = param.type.cast(mergedParams[p]);
                }
            });
        } catch (err) {
            if (['ERR_MISSING_PARAMETER', 'ERR_INVALID_TYPE'].indexOf(err.code) >= 0) {
                next(err);
                return;
            }
            throw err;
        }
        req[paramsKey] = { ...req[paramsKey], ...castedParams };
        next();
    }

    _beforeCallback(req, res, map, cb) {
        async.eachSeries(Object.keys(map), (spec, callback) => {
            if (spec === '*') {
                map[spec](req, res, callback);
                return;
            }
            const r = new RouteParser(spec);
            const match = r.match(req.path);
            if (!match) {
                callback();
                return;
            }
            map[spec](req, res, callback);
            return;
        }, cb);
    }

    _afterCallback(err, data, req, res, map, cb) {
        async.eachSeries(Object.keys(map), (spec, callback) => {
            if (spec === '*') {
                map[spec](err, data, req, res, callback);
                return;
            }
            const r = new RouteParser(spec);
            const match = r.match(req.path);
            if (!match) {
                callback();
                return;
            }
            map[spec](err, data, req, res, callback);
            return;
        }, cb);
    }

    _createApp() {
        const { after, defaultError, dataKey, errorKey, requestLimit, meta, log, logger } = this._options;
        this._app = express();

        this._app.use((req, res, next) => {
            const d = new Date();
            req.getEndpoint = () => req.__endpoint;
            res.send204 = () => {
                console.warn('res.send204 is deprecated. Use next callback in the route without data.');
                res._sendData();
            };
            res.send404 = (message = 'Page not found', code = 'page_not_found') => {
                res.sendError(HttpError.create(404, message, code));
            };
            res.send401 = (message, code) => {
                res.sendError(HttpError.create(401, message, code));
            };
            res.send501 = (message, code) => {
                res.sendError(HttpError.create(501, message, code));
            };
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
                console.warn('res.sendError is deprecated with using status codes, message and errorCode. Use HttpError instance.');
                next(new Err(message, errorCode));
            };
            res.sendData = (data, key = dataKey) => {
                console.warn('res.sendData is deprecated. Use next callback in route.');
                res._sendData(data, key);
            };
            res._sendData = (data, key = dataKey) => {
                this._afterCallback(key === errorKey, data, req, res, after, (err) => {
                    if (err) {
                        next(err);
                        return;
                    }
                    res._end(data !== undefined && data !== null ? { [key]: data } : null);
                });
            };
            res._end = (data) => {
                let body = req.body;
                if (JSON.stringify(body).length > 1024) {
                    body = 'Body too long';
                }
                const took = Date.now() - d.getTime();
                const endpoint = `${req.method} ${req.path}`;
                let deprecated = false;
                if (data) {
                    if (req.__endpoint && req.__endpoint.isDeprecated()) {
                        deprecated = true;
                        data.warning = 'This endpoint is deprecated. It can be removed in the future.';
                    }
                    if (meta.enabled && req.query.nometa === undefined) {
                        data._meta = {
                            took,
                            deprecated: deprecated || undefined,
                            rs: {
                                version: pkg.version,
                                module: `https://www.npmjs.com/package/${pkg.name}`,
                            },
                            request: {
                                endpoint,
                                body,
                                query: req.query,
                                headers: req.headers,
                            },
                            app: {
                                version: APP_PACKAGE.version,
                            },
                        };
                        if (typeof res.__meta === 'object') {
                            Object.keys(res.__meta).forEach(key => data._meta[key] = res.__meta[key]);
                        }
                    }
                    res.header('content-type', 'application/json; charset=utf-8');
                    res.write(JSON.stringify(data, null, req.query.pretty === undefined ? 0 : 4));
                } else {
                    res.status(204);
                }
                res.end();
                if (log && typeof logger === 'function') {
                    logger({
                        statusCode: res.statusCode,
                        method: req.method,
                        path: req.path,
                        spec: req.route ? req.route.path : req.path,
                        body: req.body,
                        params: req.params,
                        query: req.query,
                        headers: req.headers,
                        took,
                    });
                }
            };
            Object.keys(meta.data).forEach(key => res.addMeta(key, meta.data[key]));
            next();
        });
        this._app.use(compression());
        this._app.use(bodyParser.json({ limit: requestLimit }));
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

    _log(message) {
        if (this._options.log) {
            console.log(new Date(), message);
        }
    }
}

/**
 * 
 * @param {AppOptions} options 
 */
const m = (options = {}) => {
    const app = new Application(options);
    const { docs, name } = app._options;
    if (docs.enabled) {
        let requireAuth = false;
        if (docs.auth) {
            console.warn('Using auth on docs is deprecated. Use api key and its validation instead.');
            requireAuth = true;
        }
        app.get(docs.route, {
            requireAuth,
            description: 'Documentation of this API.',
            hideDocs: true,
        }, (req, res, next) => next(null, app.docs()));
        app.get(`${docs.route}.html`, {
            requireAuth,
            hideDocs: true,
        }, (req, res, next) => {
            res.header('content-type', 'text/html; charset=utf-8');
            fs.readFile(path.resolve(__dirname, '../assets/docs.html'), (err, buffer) => {
                if (err) {
                    next(err);
                    return;
                }
                let html = buffer.toString();
                const vars = {
                    name,
                    apiKey: app._options.apiKey.enabled ? req.query.api_key : '',
                    rsVersion: pkg.version,
                    dataKey: app._options.dataKey,
                    errorKey: app._options.errorKey,
                    meta: app._options.meta.enabled,
                    authKey: app._options.auth.key,
                    authDescription: app._options.auth.description || '',
                };
                Object.keys(vars).forEach((key) => {
                    const r = new RegExp(`\\$\\{${key}\\}`, 'g');
                    html = html.replace(r, vars[key]);
                });
                res.end(html);
            });
        });
        app.get(`${docs.route}.js`, {
            hideDocs: true,
        }, (req, res, next) => {
            res.header('content-type', 'text/javascript; charset=utf-8');
            res.sendFile(path.resolve(__dirname, '../assets/docs.js'));
        });
        app.get(`${docs.route}.css`, {
            hideDocs: true,
        }, (req, res, next) => {
            res.header('content-type', 'text/css; charset=utf-8');
            res.sendFile(path.resolve(__dirname, '../assets/docs.css'));
        });
    }
    return app;
};

export {
    m as default,
    HttpError,
    Endpoint,
    Err as Error,
    Param,
    Type,
    Field,
    ErrorField,
};
