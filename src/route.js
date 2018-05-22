export default class Route {

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
