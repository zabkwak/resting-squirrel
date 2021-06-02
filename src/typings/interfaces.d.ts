import * as express from 'express';
import HttpSmartError from 'http-smart-error';

import Benchmark from '../benchmark';
import Endpoint from '../endpoint';
import ErrorField from '../endpoint/error-field';
import Field, { FieldShape, FieldShapeArray } from '../endpoint/field';
import Param, { ParamShape, ParamShapeArray } from '../endpoint/param';
import { RouteAuth } from './enums';
import { MiddlewareNext } from './types';
import Response from '../response';

/**
 * @typeparam A Type of the args.
 * @typeparam Q Type of the query.
 * @typeparam B Type of the Body.
 * @typeparam EP Type of the Endpoint props.
 */
export interface IRequest<A = any, Q = any, B = any, EP = Record<string, any>> extends express.Request {
	getEndpoint(): Endpoint<IRequest<A, Q, B, EP>, EP>;
	getBenchmark(): Benchmark;
	/** Api key sent in the request. */
	apiKey: string;
	/** Access token with which is the request signed. */
	accessToken: string;
	params: A;
	query: Q;
	body: B;
}

export interface IResponse extends express.Response {
	/** @deprecated */
	send204(): void;
	send401(): void;
	send401(message: string): void;
	send401(message: string, code: string): void;
	send404(): void;
	send404(message: string): void;
	send404(message: string, code: string): void;
	send501(): void;
	send501(message: string): void;
	send501(message: string, code: string): void;
	addMeta(key: string, value: any): void;
	sendError(error: HttpSmartError): void;
	/** @deprecated */
	sendData(): void;
	/** @deprecated */
	sendData(data: any): void;
	/** @deprecated */
	sendData(data: any, dataKey: string): void;
}

export interface IDocsItem {
	/** @deprecated */
	docs: string;
	description: string;
	args: { [key: string]: Field | FieldShape | FieldShapeArray };
	params: { [key: string]: Param | ParamShape | ParamShapeArray };
	required_params: Array<string>;
	required_auth: boolean;
	response: { [key: string]: Field | FieldShape | FieldShapeArray };
	errors: { [code: string]: string };
	deprecated: boolean;
}

export interface IRouteOptions<IProps = Record<string, any>> {
	/** 
	 * If true the endpoint require authorization and the auth process of the module is executed.
	 * @deprecated
	 */
	requireAuth?: boolean,
	/**
	 * Auth mode of the route. If the value is optional the endpoint can take authorization and acts like endpoint which requires auth.
	 */
	auth?: RouteAuth,
	/** List of params of the endpoint. */
	params?: Array<Param | ParamShape | ParamShapeArray | string>,
	/** List of response fields. */
	response?: Response.Base | (Array<Field | FieldShape | FieldShapeArray>),
	/** List of errors that the endpoint can return. */
	errors?: ErrorField[] | string[],
	/** Description of the endpoint. */
	description?: string,
	/** If true the endpoint is hidden from the documentation. */
	hideDocs?: boolean,
	/** List of arguments. */
	args?: Field[],
	/** If true the endpoint requires API key. */
	requireApiKey?: boolean,
	/** List of api keys or function returning the promise with the list where the endpoint will return 404 error. */
	excludedApiKeys?: (() => Promise<string[]>) | string[];
	/** Time in milliseconds. After the timeout the 408 error is returned. It overrides the global timeout. */
	timeout?: number;
	/** Custom properties for the endpoint. */
	props?: IProps;
}

export interface IAppOptions {
	/** Port number where the app listens */
	port?: number,
	/** Name of the app. */
	name?: string,
	/** Key in response where the data are stored. */
	dataKey?: string,
	/** Key in response where the error is stored. */
	errorKey?: string,
	/** If true the app is logging. */
	log?: boolean | {
		/** If true the app is logging data according the log level. */
		enabled?: boolean,
		/** Level of logging data. */
		level?: 'error' | 'warning' | 'verbose',
		/** If true the app is logging the stack trace if error occurs. */
		stack?: boolean,
	},
	/** 
	 * If true the app is logging the stack trace if error occurs. 
	 * @deprecated
	 */
	logStack?: boolean,
	/** Function to log a data. The `log.enabled` option must be set to true to call it. It's ignoring the log level. */
	logger?: <R extends IRequest<any, any, any>>(data: {
		/** HTTP status code. */
		statusCode: number,
		/** HTTP method. */
		method: string,
		/** Endpoint path. */
		path: string,
		/** Endpoint route spec. */
		spec: string,
		/** Request body. */
		body: Record<string, any>,
		/** Request params. */
		params: Record<string, any>,
		/** Request query. */
		query: Record<string, any>,
		/** Request headers. */
		headers: Record<string, any>,
		/** Execution time of the endpoint in milliseconds. */
		took: number,
		/** Response sent to the client. */
		response: { data?: any, error?: HttpSmartError, _meta?: any },
	}, req: R) => void,
	/** Option to set meta data in the response. */
	meta?: {
		/** If true meta data are in the response in key `_meta`. */
		enabled?: boolean,
		/** Additional meta data. */
		data?: Record<string, any>,
	},
	/** Limit of the request body. */
	requestLimit?: string,
	/** Charset of the response. */
	charset?: string,
	/** Docs settings. */
	docs?: {
		/** If false the documentation is not accessible. */
		enabled?: boolean,
		/** Route of the documentation. */
		route?: string,
		/**
		 * If true the documentation requries authorization.
		 * @deprecated
		 */
		auth?: boolean,
		/** If true the params are as array in the documentation. */
		paramsAsArray?: boolean,
	},
	/** Authorization settings. */
	auth?: (<R extends IRequest<any, any, any>>(req: R, res: IResponse, next: MiddlewareNext) => void) | {
		/** Header key where the authorization token is located. */
		key?: string,
		/** Description of the authorization process. */
		description?: string,
		/** Validator function executed while validating authorization token in the endpoint lifecycle. */
		validator?: (<R extends IRequest<any, any, any>>(key: string, req: R, res: IResponse) => Promise<boolean>) | (<R extends IRequest<any, any, any>>(key: string, req: R, res: IResponse, next: MiddlewareNext) => void),
	},
	/** 
	 * Api key settings.
	 * @deprecated
	 */
	apiKey?: {
		/**
		 * If true all requests require api key parameter. It can be overriden in the endpoint config.
		 */
		enabled?: boolean,
		/**
		 * The location of the api key. 
		 * @deprecated
		 */
		type?: 'qs' | 'body' | 'header',
		/**
		 * Validator function executed while validating api key in the endpoint lifecycle.
		 */
		validator?: ((apiKey: string) => Promise<boolean>) | ((apiKey: string, next: MiddlewareNext) => void),
	},
	/** Global timeout for all endpoints. After the time the 408 error is returned. */
	timeout?: number;
	/** 
	 * Methods called before the endpoint callback execution.
	 * @deprecated
	 */
	before?: (<R extends IRequest<any, any, any>>(req: R, res: IResponse, next: MiddlewareNext) => void) | {
		[route: string]: <R extends IRequest<any, any, any>>(req: R, res: IResponse, next: MiddlewareNext) => void,
	},
	/**
	 * Methods to call after the endpoint callback execution.
	 * @deprecated
	 */
	after?: (<R extends IRequest<any, any, any>>(isError: boolean, data: any, req: R, res: IResponse, next: MiddlewareNext) => void) | {
		[route: string]: <R extends IRequest<any, any, any>>(isError: boolean, data: any, req: R, res: IResponse, next: MiddlewareNext) => void,
	},
	/** Default error to show. */
	defaultError?: {
		statusCode?: number,
		message?: string,
		code?: string,
	},
	/** If true the parameters are validated and warnings are returned if something is wrong. */
	validateParams?: boolean,
	/** If true the response data are strictly validated to types. It can throw an invalid type error. */
	responseStrictValidation?: boolean,
	/** Indicates if the array response should be wrapped to object `{ items: [], count: 0 }`. */
	wrapArrayResponse?: boolean,
	/** Indicates if the error response should contain error stack trace. */
	errorStack?: boolean,
}