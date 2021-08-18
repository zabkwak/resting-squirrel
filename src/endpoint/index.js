import Param, { ParamParser } from './param';
import Field from './field';
import RSError from '../error';
import ErrorField from './error-field';
import { BaseResponse, JSONResponse } from '../response';
import InvalidArgumentTypeError from '../error/errors/invalid-argument-type';
import InvalidParameterTypeError from '../error/errors/invalid-parameter-type';
import InvalidInputTypeError from '../error/errors/invalid-input-type';
import MissingParameterError from '../error/errors/missing-parameter';
import MissingApiKeyError from '../error/errors/missing-api-key';
import InvalidApiKeyError from '../error/errors/invalid-api-key';
import MissingAccessTokenError from '../error/errors/missing-access-token';
import InvalidAccessTokenError from '../error/errors/invalid-access-token';
import TimeoutError from '../error/errors/timeout';

class Endpoint {

	/**
	 * @typedef Options
	 * @property {number?} version
	 * @property {number?} auth
	 * @property {boolean} requireAuth
	 * @property {Param[]|string[]} params
	 * @property {BaseResponse} response
	 * @property {string[]|ErrorField[]|RSError[]} errors
	 * @property {string} description
	 * @property {boolean} hideDocs
	 * @property {function} callback
	 * @property {boolean} validateParams
	 * @property {boolean} apiKeyEnabled
	 * @property {string[]|function} excludedApiKeys
	 * @property {number} timeout
	 * @property {any} props
	 * @property {Field[]} args
	 */

	version = null;
	auth = 0;
	/** @type {Param[]} */
	params = null;
	/** @type {BaseResponse} */
	response = null;
	/** @type {ErrorField[]} */
	errors = null;
	description = null;
	hideDocs = false;
	callback = null;
	route = null;
	deprecated = false;
	apiKeyEnabled = false;
	excludedApiKeys = [];
	timeout = null;
	props = {};
	args = {};

	/** 
	 * @type {string[]}
	 * @deprecated 
	 */
	get requiredParams() {
		return this.params.filter(param => param.required).map(param => param.name);
	}

	/**
	 * @type {string}
	 * @deprecated
	 */
	get docs() {
		return this.description;
	}

	get requiredAuth() {
		switch (this.auth) {
			case 2:
				return true;
			default:
				return false;
		}
	}

	/**
	 * 
	 * @param {*} route 
	 * @param {Options} options 
	 */
	constructor(route, options = {}) {
		this.version = options.version === undefined ? null : options.version;
		this.auth = options.auth || 0;
		this.params = ParamParser.parse(options.params || []);
		this.response = options.response === undefined ? new JSONResponse([]) : options.response;
		this.errors = (options.errors || []).map((e) => {
			if (e instanceof ErrorField) {
				return e;
			}
			if (e instanceof RSError) {
				return e.toErrorField();
			}
			return new ErrorField(e);
		});
		this.description = options.description || null;
		this.hideDocs = options.hideDocs || false;
		this.callback = options.callback || null;
		this.apiKeyEnabled = options.apiKeyEnabled || false;
		this.excludedApiKeys = options.excludedApiKeys || [];
		this.timeout = options.timeout || null;
		this.props = options.props || {};
		this.args = this._mergeArguments(route, options.args);
		if (options.validateParams) {
			this._validateParams();
		}
		if (route) {
			route.addEndpoint(this);
		}
		this._setErrors();
	}

	getEndpoint() {
		if (this.version === null) {
			return this.route.route;
		}
		return `/${this.version}${this.route.route}`;
	}

	getParams(array = false) {
		if (array) {
			return this.params;
		}
		const o = {};
		this.params.forEach(p => o[p.name] = p);
		return o;
	}

	getResponse(array = false) {
		return this.response ? this.response.get(array) : null;
	}

	getResponseType(charset) {
		return this.response ? this.response.getContentType(charset) : null;
	}

	getArguments(array = false) {
		if (array) {
			return this.args;
		}
		const o = {};
		this.args.forEach((a => o[a.name] = a));
		return o;
	}

	getRouteArguments() {
		if (!this.route) {
			return {};
		}
		return this.route.args;
	}

	getErrors(array = false) {
		if (array) {
			return this.errors;
		}
		const o = {};
		this.errors.forEach(p => o[p.code] = p.description);
		return o;
	}

	getAuth() {
		switch (this.auth) {
			case 2: return 'REQUIRED';
			case 1: return 'OPTIONAL';
			default: return 'DISABLED';
		}
	}

	isDeprecated() {
		if (!this.route) {
			return false;
		}
		return this.deprecated || this.route.getMaxVersion() !== this.version;
	}

	async isApiKeyExcluded(key) {
		if (typeof this.excludedApiKeys === 'function') {
			return (await this.excludedApiKeys()).includes(key);
		}
		return this.excludedApiKeys.includes(key);
	}

	deprecate() {
		this.deprecated = true;
		return this;
	}

	auth() {
		this.requiredAuth = true;
		return this;
	}

	/**
	 * 
	 * @param {string} docs 
	 * @deprecated
	 */
	setDocs(docs) {
		this.description = docs;
		return this;
	}

	_validateParams() {
		const names = [];
		this.params.forEach((param) => {
			if (names.indexOf(param.name) >= 0) {
				console.warn(`Param with name '${param.name}' already exists. It can cause unpredictable effects.`);
			}
			if (param.type.toString() === 'any') {
				console.warn(`Param with name '${param.name}' is type of 'any'. It can cause unpredictable effects.`);
			}
		});
	}

	_setErrors() {
		const params = Boolean(this.params.length);
		const args = this.route && Object.keys(this.route.args).length;
		if (args && params) {
			this.errors.unshift(InvalidInputTypeError.toErrorField());
		} else if (params) {
			this.errors.unshift(InvalidParameterTypeError.toErrorField());
		} else if (args) {
			this.errors.unshift(InvalidArgumentTypeError.toErrorField());
		}
		if (this.requiredParams.length) {
			this.errors.unshift(MissingParameterError.toErrorField());
		}
		if (this.requiredAuth) {
			this.errors.unshift(InvalidAccessTokenError.toErrorField());
			this.errors.unshift(MissingAccessTokenError.toErrorField());
		}
		if (this.apiKeyEnabled) {
			this.errors.unshift(InvalidApiKeyError.toErrorField());
			this.errors.unshift(MissingApiKeyError.toErrorField());
		}
		if (this.timeout) {
			this.errors.unshift(TimeoutError.toErrorField());
		}
	}

	_mergeArguments(route, args = []) {
		if (route) {
			return route.getArguments(true).map((routeArg) => {
				return args.find(({ name }) => name === routeArg.name) || routeArg;
			});
		}
		return args;
	}
}

export {
	Endpoint as default,
	Param,
	Field,
	ErrorField,
};
