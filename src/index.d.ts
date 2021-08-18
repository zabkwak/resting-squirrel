
import SmartError from 'smart-error';
import HttpSmartError from 'http-smart-error';
import RuntimeType, { Model } from 'runtime-type';

import Endpoint, { Param, Field, ErrorField } from './endpoint';

import RSError from './error';
import { IResponse, IRequest, IDocsItem, IRouteOptions, IAppOptions, IErrorField } from './typings/interfaces';
import { MiddlewareNext, RouteCallback } from './typings/types';
import { RouteAuth } from './typings/enums';
import Response from './response';

declare class Application {

	/** Version of the application. */
	version: string;

	constructor();
	constructor(options: IAppOptions);

	/**
	 * Registers the middleware callback to all routes.
	 * 
	 * @param callback Callback to execute as middleware.
	 */
	use<R extends IRequest>(callback: (req: R, res: IResponse, next: MiddlewareNext) => void): void;

	/**
	 * Registers the middleware callback to the specific route.
	 * 
	 * @param route Route where the middleware should be used.
	 * @param callback Callback to execute as middleware.
	 */
	use<R extends IRequest>(route: string, callback: (req: R, res: IResponse, next: MiddlewareNext) => void): void;

	/**
	 * Registers the API key handler to validate api key.
	 * 
	 * @param handler The validator function.
	 */
	public registerApiKeyHandler<R extends IRequest>(handler: (apiKey: string, req: R) => Promise<boolean>): this;

	/**
	 * Registers a function to execute before the endpoint execution.
	 *
	 * @param spec Specification of the route where the callback is used.
	 * @param callback Function to execute before the endpoint execution.
	 */
	registerBeforeExecution<R extends IRequest>(
		spec: string,
		callback: (req: R, res: IResponse) => Promise<void>
	): this;

	/**
	 * Registers a function to execute after the endpoint execution.
	 *
	 * @param spec Specification of the route where the callback is used.
	 * @param callback Function to execute after the endpoint execution.
	 */
	registerAfterExecution<R extends IRequest>(
		spec: string,
		callback: (isError: boolean, data: any, req: R, res: IResponse) => Promise<void>
	): this;

	/**
	 * Registers the GET endpoint without a version and with default options.
	 * @param route Route of the endpoint.
	 * @param callback Callback to execute.
	 */
	get<R extends IRequest<any, any, any, EP>, EP = Record<string, any>>(route: string, callback: RouteCallback<R>): Endpoint<R, EP>;
	/**
	 * Registers the GET endpoint without a version.
	 * @param route Route of the endpoint.
	 * @param options Options of the endpoint.
	 * @param callback Callback to execute.
	 */
	get<R extends IRequest<any, any, any, EP>, EP = Record<string, any>>(route: string, options: IRouteOptions<EP>, callback: RouteCallback<R>): Endpoint<R, EP>;
	/**
	 * Registers the GET endpoint with default options.
	 * @param version Version of the endpoint.
	 * @param route Route of the endpoint.
	 * @param callback Callback to execute.
	 */
	get<R extends IRequest<any, any, any, EP>, EP = Record<string, any>>(version: number, route: string, callback: RouteCallback<R>): Endpoint<R, EP>;
	/**
	 * Registers the GET endpoint.
	 * @param version Version of the endpoint.
	 * @param route Route of the endpoint.
	 * @param options Options of the endpoint.
	 * @param callback Callback to execute.
	 */
	get<R extends IRequest<any, any, any, EP>, EP = Record<string, any>>(version: number, route: string, options: IRouteOptions<EP>, callback: RouteCallback<R>): Endpoint<R, EP>;

	/**
	 * Registers the PUT endpoint without a version and with default options.
	 * @param route Route of the endpoint.
	 * @param callback Callback to execute.
	 */
	put<R extends IRequest<any, any, any, EP>, EP = Record<string, any>>(route: string, callback: RouteCallback<R>): Endpoint<R, EP>;
	/**
	 * Registers the PUT endpoint without a version.
	 * @param route Route of the endpoint.
	 * @param options Options of the endpoint.
	 * @param callback Callback to execute.
	 */
	put<R extends IRequest<any, any, any, EP>, EP = Record<string, any>>(route: string, options: IRouteOptions<EP>, callback: RouteCallback<R>): Endpoint<R, EP>;
	/**
	 * Registers the PUT endpoint with default options.
	 * @param version Version of the endpoint.
	 * @param route Route of the endpoint.
	 * @param callback Callback to execute.
	 */
	put<R extends IRequest<any, any, any, EP>, EP = Record<string, any>>(version: number, route: string, callback: RouteCallback<R>): Endpoint<R, EP>;
	/**
	 * Registers the PUT endpoint.
	 * @param version Version of the endpoint.
	 * @param route Route of the endpoint.
	 * @param options Options of the endpoint.
	 * @param callback Callback to execute.
	 */
	put<R extends IRequest<any, any, any, EP>, EP = Record<string, any>>(version: number, route: string, options: IRouteOptions<EP>, callback: RouteCallback<R>): Endpoint<R, EP>;

	/**
	 * Registers the POST endpoint without a version and with default options.
	 * @param route Route of the endpoint.
	 * @param callback Callback to execute.
	 */
	post<R extends IRequest<any, any, any, EP>, EP = Record<string, any>>(route: string, callback: RouteCallback<R>): Endpoint<R, EP>;
	/**
	 * Registers the POST endpoint without a version.
	 * @param route Route of the endpoint.
	 * @param options Options of the endpoint.
	 * @param callback Callback to execute.
	 */
	post<R extends IRequest<any, any, any, EP>, EP = Record<string, any>>(route: string, options: IRouteOptions<EP>, callback: RouteCallback<R>): Endpoint<R, EP>;
	/**
	 * Registers the POST endpoint with default options.
	 * @param version Version of the endpoint.
	 * @param route Route of the endpoint.
	 * @param callback Callback to execute.
	 */
	post<R extends IRequest<any, any, any, EP>, EP = Record<string, any>>(version: number, route: string, callback: RouteCallback<R>): Endpoint<R, EP>;
	/**
	 * Registers the POST endpoint.
	 * @param version Version of the endpoint.
	 * @param route Route of the endpoint.
	 * @param options Options of the endpoint.
	 * @param callback Callback to execute.
	 */
	post<R extends IRequest<any, any, any, EP>, EP = Record<string, any>>(version: number, route: string, options: IRouteOptions<EP>, callback: RouteCallback<R>): Endpoint<R, EP>;

	/**
	 * Registers the DELETE endpoint without a version and with default options.
	 * @param route Route of the endpoint.
	 * @param callback Callback to execute.
	 */
	delete<R extends IRequest<any, any, any, EP>, EP = Record<string, any>>(route: string, callback: RouteCallback<R>): Endpoint<R, EP>;
	/**
	 * Registers the DELETE endpoint without a version.
	 * @param route Route of the endpoint.
	 * @param options Options of the endpoint.
	 * @param callback Callback to execute.
	 */
	delete<R extends IRequest<any, any, any, EP>, EP = Record<string, any>>(route: string, options: IRouteOptions<EP>, callback: RouteCallback<R>): Endpoint<R, EP>;
	/**
	 * Registers the DELETE endpoint with default options.
	 * @param version Version of the endpoint.
	 * @param route Route of the endpoint.
	 * @param callback Callback to execute.
	 */
	delete<R extends IRequest<any, any, any, EP>, EP = Record<string, any>>(version: number, route: string, callback: RouteCallback<R>): Endpoint<R, EP>;
	/**
	 * Registers the DELETE endpoint.
	 * @param version Version of the endpoint.
	 * @param route Route of the endpoint.
	 * @param options Options of the endpoint.
	 * @param callback Callback to execute.
	 */
	delete<R extends IRequest<any, any, any, EP>, EP = Record<string, any>>(version: number, route: string, options: IRouteOptions, callback: RouteCallback<R>): Endpoint<R, EP>;

	/**
	 * Registers the API endpoint route without a version and with default options.
	 * @param method HTTP method of the route.
	 * @param route Route of the endpoint.
	 * @param callback Callback to execute.
	 */
	registerRoute<R extends IRequest<any, any, any, EP>, EP = Record<string, any>>(method: string, route: string, callback: RouteCallback<R>): Endpoint<R, EP>;
	/**
	 * Registers the API endpoint route without a version.
	 * @param method HTTP method of the route.
	 * @param route Route of the endpoint.
	 * @param options Options of the endpoint.
	 * @param callback Callback to execute.
	 */
	registerRoute<R extends IRequest<any, any, any, EP>, EP = Record<string, any>>(method: string, route: string, options: IRouteOptions<EP>, callback: RouteCallback<R>): Endpoint<R, EP>;
	/**
	 * Registers the API endpoint route.
	 * @param method HTTP method of the route.
	 * @param version Version of the endpoint.
	 * @param route Route of the endpoint.
	 * @param options Options of the endpoint.
	 * @param callback Callback to execute.
	 */
	registerRoute<R extends IRequest<any, any, any, EP>, EP = Record<string, any>>(method: string, version: number, route: string, options: IRouteOptions<EP>, callback: RouteCallback<R>): Endpoint<R, EP>;

	/**
	 * Registers the API endpoint route. 
	 * @param method HTTP method of the route.
	 * @param version Version of the endpoint.
	 * @param route Route of the endpoint.
	 * @param requireAuth If true the endpoint requires an authorization.
	 * @param params Definition of endpoint params.
	 * @param description Description of the ednpoint.
	 * @param callback Callback to execute.
	 * @deprecated
	 */
	registerRoute<R extends IRequest<any, any, any, EP>, EP = Record<string, any>>(method: string, version: number, route: string, requireAuth: boolean, params: any, description: string, callback: RouteCallback<R>): Endpoint<R, EP>;

	/**
	 * Starts the application.
	 * 
	 * @deprecated
	 */
	listen(): void;
	/**
	 * Starts the application.
	 * 
	 * @param cb Callback called after the app is listening.
	 * @deprecated
	 */
	listen(cb: (err?: any, data?: { stats: { warning: number, error: number } }) => void): void;

	/**
	 * Starts the application.
	 */
	start(): void;
	/**
	 * Starts the application.
	 * 
	 * @param cb Callback called after the app is listening.
	 */
	start(cb: (err?: any, data?: { stats: { warning: number, error: number } }) => void): void;

	/**
	 * Stops the application.
	 */
	stop(): void;
	/**
	 * Stops the application.
	 * 
	 * @param cb Callback called after the server stopped.
	 */
	stop(cb?: () => void): void;

	docs(): Promise<{ [endpoint: string]: IDocsItem }>;
	docs(apiKey: string): Promise<{ [endpoint: string]: IDocsItem }>;

	getDocs(): { [endpoint: string]: IDocsItem };
}

export {
	RuntimeType as Type,
	Model as TypeModel,
	SmartError as Error,
	HttpSmartError as HttpError,
	ErrorField,
	Param,
	Field,
	Endpoint,
	Application,
	Response,
	RouteAuth,
	RSError,
	// Interfaces
	IRequest,
	IResponse,
	IAppOptions,
	IRouteOptions,
	IErrorField,
}

/** @deprecated */
export type App = Application;

/**
 * Creates an instance of Application.
 * @deprecated Use Application constructor.
 */
export default function (options?: IAppOptions): Application;
