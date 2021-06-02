import Endpoint from './endpoint';
import Field from './endpoint/field';

export default class Route {
	/** HTTP method of the route. */
	method: string;
	/** Route path. */
	route: string;
	/** Map of endpoints by version. */
	routes: { [version: number]: Endpoint };
	/** Map of arguments. */
	args: { [key: string]: Field };

	constructor(method: string, route: string);
	constructor(method: string, route: string, args: Field[]);

	/**
	 * Adds the endpoin to the routes map.
	 * @param Endpoint Endpoint to add.
	 */
	addEndpoint(endpoint: Endpoint): void;
	/**
	 * Gets the maximal version of all endpoints.
	 */
	getMaxVersion(): number;
}