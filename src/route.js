import Type from 'runtime-type';
import Field from "./endpoint/field";

export default class Route {

    method = null;
    route = null;
    routes = {};
    args = {};

    constructor(method, route, args = []) {
        this.method = method;
        this.route = route; 
        this.args = this._getArgs();
        args.forEach(arg => this.args[arg.name] = arg);
    }

    addEndpoint(endpoint) {
        this.routes[endpoint.version] = endpoint;
        endpoint.route = this;
    }

    getMaxVersion() {
        const max = Math.max.apply(null, Object.keys(this.routes));
        if (isNaN(max)) {
            return null;
        }
        return max;
    }

    _getArgs() {
        const args = {};
        (this.route.match(/(:\w+)/g) || []).map(m => m.substr(1)).forEach(param => args[param] = new Field(param, Type.any));
        return args;
    }
}
