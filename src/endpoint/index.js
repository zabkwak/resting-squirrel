import Type from 'runtime-type';
import Error from 'smart-error';

import Param, { ParamParser } from './param';

class Endpoint {

    version = null;
    requiredAuth = null;
    /** @type {Param[]} */
    params = null;
    docs = null;
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

    constructor(version = null, requiredAuth = false, params = [], docs = null, callback = null) {
        this.version = version;
        this.requiredAuth = requiredAuth;
        this.params = ParamParser.parse(params);
        this.docs = docs;
        this.callback = callback;
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

    setDocs(docs) {
        this.docs = docs;
        return this;
    }
}

export {
    Endpoint as default,
    Param,
};
