import Type from 'runtime-type';
import Error from 'smart-error';

import Param, { ParamParser } from './param';
import Field from './field';

class Endpoint {

    version = null;
    requiredAuth = null;
    /** @type {Param[]} */
    params = null;
    response = null;
    description = null;
    hideDocs = false;
    callback = null;
    // TODO co to kurva je?
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

    constructor(version = null, requiredAuth = false, params = [], response = [], description = null, hideDocs = false, callback = null, validateParams = true) {
        this.version = version;
        this.requiredAuth = requiredAuth;
        this.params = ParamParser.parse(params);
        this.response = response;
        this.description = description;
        this.hideDocs = hideDocs;
        this.callback = callback;
        if (validateParams) {
            this._validateParams();
        }
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
}

export {
    Endpoint as default,
    Param,
    Field,
};
