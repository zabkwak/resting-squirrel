import Param, { ParamParser } from './param';
import Field from './field';
import Error from './error';

class Endpoint {

    /**
     * @typedef Options
     * @property {number?} version
     * @property {boolean} requireAuth
     * @property {Param[]|string[]} params
     * @property {Field[]} response
     * @property {string[]|Error[]} errors
     * @property {string} description
     * @property {boolean} hideDocs
     * @property {function} callback
     * @property {boolean} validateParams
     */

    version = null;
    requiredAuth = null;
    /** @type {Param[]} */
    params = null;
    /** @type {Field[]} */
    response = null;
    /** @type {Error[]} */
    errors = null;
    description = null;
    hideDocs = false;
    callback = null;
    route = null;
    deprecated = false;

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

    /**
     * 
     * @param {*} route 
     * @param {Options} options 
     */
    constructor(route, options = {}) {
        this.version = options.version === undefined ? null : options.version;
        this.requiredAuth = options.requireAuth || false;
        this.params = ParamParser.parse(options.params || []);
        this.response = options.response === undefined ? [] : options.response;
        this.errors = (options.errors || []).map((e) => {
            if (e instanceof Error) {
                return e;
            }
            return new Error(e);
        });
        this.description = options.description || null;
        this.hideDocs = options.hideDocs || false;
        this.callback = options.callback || null;
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
        if (!this.response) {
            return null;
        }
        if (array) {
            return this.response;
        }
        const o = {};
        this.response.forEach(p => o[p.name] = p);
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

    isDeprecated() {
        if (!this.route) {
            return false;
        }
        return this.deprecated || this.route.getMaxVersion() !== this.version;
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
                console.warn(`Param with name '${name}' already exists. It can cause unpredictable effects.`);
            }
            if (param.type.toString() === 'any') {
                console.warn(`Param with name '${param.name}' is type of 'any'. It can cause unpredictable effects.`);
            }
        });
    }

    _setErrors() {
        if (this.params.length) {
            this.errors.unshift(new Error('ERR_INVALID_TYPE', 'Returned if one of the parameters has invalid type.'));
        }
        if (this.requiredParams.length) {
            this.errors.unshift(new Error('ERR_MISSING_PARAMETER', 'Returned if one of the required parameters is not defined.'));
        }
        // TODO missing_api_key
    }
}

export {
    Endpoint as default,
    Param,
    Field,
    Error,
};
