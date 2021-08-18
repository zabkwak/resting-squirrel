import Route from '../route';
import { RouteAuth } from '../typings/enums';
import { IErrorField, IRequest } from '../typings/interfaces';
import { RouteCallback } from '../typings/types';
import ErrorField from './error-field';
import Field from './field';
import Param, { ParamShape, ParamShapeArray } from './param';
import Response from '../response';
import RSError from '../error';

export default class Endpoint<R extends IRequest<any, any, any, any> = any, IProps = Record<string, any>> {

	version: number;
	requiredAuth: boolean;
	params: Param[];
	response: Response.Base;
	errors: IErrorField[];
	description: string;
	hideDocs: boolean;
	callback: RouteCallback<R>;
	route: Route;
	deprecated: boolean;
	apiKeyEnabled: boolean;
	excludedApiKeys: (() => Promise<string[]>) | string[];
	timeout: number;
	props: IProps;

	requiredParams: string[];
	/**
	 * @deprecated
	 */
	docs: string;

	/**
	 * 
	 * @param route Route of the endpoint
	 */
	constructor(route: string);

	/**
	 * 
	 * @param route Route of the endpoint.
	 * @param options Endpoint options.
	 */
	constructor(route: string, options: {
		/** Version number of the endpoint. */
		version?: number,
		/** If true the encpoint require authorization and the auth process of the module is executed. */
		requireAuth?: boolean,
		/**
		 * Auth mode of the route. If the value is optional the endpoint can take authorization and acts like endpoint which requires auth.
		 */
		auth?: RouteAuth;
		/** List of params of the endpoint. */
		params?: Array<Param | ParamShape | ParamShapeArray | string>,
		/** List of response fields. */
		response?: Response.Base,
		/** List of errors that the endpoint can return. */
		errors?: ErrorField[] | string[] | RSError[],
		/** Description of the endpoint. */
		description?: string,
		/** If true the endpoint is hidden from the documentation. */
		hideDocs?: boolean,
		/** The callback to execute if the endpoint is called. */
		callback?: RouteCallback<R>,
		/** If true the parameters are validated for invalid types. */
		validateParams?: boolean,
		/** If false the api key is not required. */
		apiKeyEnabled?: boolean,
		/** List of api keys or function returning the promise with the list where the endpoint will return 404 error. */
		excludedApiKeys?: (() => Promise<string[]>) | string[];
		/** Time in milliseconds. After the timeout the 408 error is returned. */
		timeout?: number;
	});

	/**
	 * Gets the string representation of the endpoint.
	 */
	getEndpoint(): string;

	/**
	 * Gets the map of the params.
	 */
	getParams(): { [key: string]: Param };
	/**
	 * Gets the list or map of the params.
	 * @param array If true the returned value is array of params. Otherwise it is the map of the params.
	 */
	getParams(array: boolean): Param[] | { [key: string]: Param };
	/**
	 * Gets the map of the response fields.
	 */
	getResponse(): { [key: string]: Field };
	/**
	 * Gets the list or map of the response fields.
	 * @param array If true the returned value is array of fields. Otherwise it is the map of the fields.
	 */
	getResponse(array: boolean): Field[] | { [key: string]: Field };
	/**
	 * Gets the content type of the response.
	 */
	getResponseType(): string;
	/**
	 * Gets the endpoint arguments.
	 */
	getArguments(): { [key: string]: Field };
	/**
	 * Gets the list or map of the argument fields.
	 * @param array If true the returned value is array of fields. Otherwise it is the map of the fields.
	 */
	getArguments(array: boolean): { [key: string]: Field };
	/**
	 * Gets the map of arguments specified in the Route.
	 * @deprecated
	 */
	getRouteArguments(): { [key: string]: Field };
	/**
	 * Gets the map of the errors.
	 */
	getErrors(): Record<string, IErrorField>;
	/**
	 * Gets the list or map of the errors.
	 * @param array If true the returned value is array of errors. Otherwise it is the map of the errors.
	 */
	getErrors(array: boolean): IErrorField[] | Record<string, IErrorField>;
	/**
	 * Checks if the endpoint is deprecated. If `deprecated` field is set as false, the versions are compared. All versions below maximal version are automatically deprecated.
	 */
	isDeprecated(): boolean;
	/**
	 * Checks if the api key is in the excluded api keys.
	 * @param key Api key to check.
	 */
	isApiKeyExcluded(key: string): Promise<boolean>;
	/**
	 * Sets the endpoint as deprecated.
	 */
	deprecate(): Endpoint<R, IProps>;
	/**
	 * Sets the endpoint as requiring auth.
	 * @deprecated
	 */
	auth(): Endpoint<R, IProps>;
	/**
	 * Sets the description.
	 * @param docs Endpoint description.
	 * @deprecated
	 */
	setDocs(docs: string): Endpoint<R, IProps>;
}

export {
	Param,
	Field,
	ErrorField,
};
