export default class Route {

    static routes = {};

    static add(method, name, endpoint) {
        const key = `${method}${name}`;
        if (!this.routes[key]) {
            this.routes[key] = new this(method, name);
        }
        const route = this.routes[key];
        route.addEndpoint(endpoint);
        return endpoint;
    }

    method = null;
    route = null;
    routes = {};

    constructor(method, route) {
        this.method = method;
        this.route = route;
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
}
