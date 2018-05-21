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


/*


	deprecate: ->
		@deprecated = yes
		@

	auth: ->
		@requiredAuth = yes
		@

	addParams: (params) ->
		for param in params
			@addParam param

	addParam: (param) ->
		@params[param.key] =
			required: param.required
			type: param.type
			description: param.description
		@requiredParams.push param.key if param.required
		@

	setDocs: (docs) ->
		@docs = docs
		@

class Endpoint.Param
	constructor: (@key, @required = no, @type = null, @description = null) ->
*/