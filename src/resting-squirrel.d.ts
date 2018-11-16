declare module 'resting-squirrel' {

    import SmartError from 'smart-error';
    import HttpSmartError from 'http-smart-error';
    import RuntimeType from 'runtime-type';
    import * as express from 'express';

    interface IRequest<A, Q, B> extends express.Request {
        getEndpoint(): Endpoint<IRequest<A, Q, B>>;
        getBenchmark(): Benchmark;
        /** Api key sent in the request. */
        apiKey: string;
        /** Access token with which is the request signed. */
        accessToken: string;
        params: A;
        query: Q;
        body: B;
    }

    interface IResponse extends express.Response {
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

    type Type = RuntimeType.Type;

    type RouteCallback<R extends IRequest<any, any, any>> = (req: R, res: IResponse, next: (error?: HttpSmartError | SmartError | Error | string | null, data?: any) => void) => void | Promise<any>;

    type MiddlewareNext = (error?: HttpSmartError | SmartError | Error | string | null) => void;

    interface IAppOptions {
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
            /** If true the app is logging the stack trace if error occures. */
            stack?: boolean,
        },
        /** 
         * If true the app is logging the stack trace if error occures. 
         * @deprecated
         */
        logStack?: boolean,
        /** Function to log a data. The `log.enabled` option must be set to true to call it. It's ignoring the log level. */
        logger?: (data: {
            /** HTTP status code. */
            statusCode: number,
            /** HTTP method. */
            method: string,
            /** Endpoint path. */
            path: string,
            /** Endpoint route spec. */
            spec: string,
            /** Request body. */
            body: { [key: string]: any },
            /** Request params. */
            params: { [key: string]: any },
            /** Request query. */
            query: { [key: string]: any },
            /** Request headers. */
            headers: { [key: string]: any },
            /** Execution time of the endpoint in milliseconds. */
            took: number,
            /** Response sent to the client. */
            response: { data?: any, error?: HttpSmartError, _meta?: any },
        }) => void,
        /** Option to set meta data in the response. */
        meta?: {
            /** If true meta data are in the response in key `_meta`. */
            enabled?: boolean,
            /** Additional meta data. */
            data?: { [key: string]: any },
        },
        /** Limit of the request body. */
        requestLimit?: string,
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
        /** Api key settings. */
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
        /** Methods called before the endpoint callback execution. */
        before?: (<R extends IRequest<any, any, any>>(req: R, res: IResponse, next: MiddlewareNext) => void) | {
            [route: string]: <R extends IRequest<any, any, any>>(req: R, res: IResponse, next: MiddlewareNext) => void,
        },
        /**
         * Methods to call after the endpopint callback execution.
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
    }

    interface RouteOptions {
        /** If true the encpoint require authorization and the auth process of the module is executed. */
        requireAuth?: boolean,
        /** List of params of the endpoint. */
        params?: Param[] | string[],
        /** List of response fields. */
        response?: Array<Field | FieldShape | FieldShapeArray>,
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
    }

    class Application {

        /** Version of the application. */
        version: string;

        /**
         * Registers the middleware callback to all routes.
         * 
         * @param callback Callback to execute as middleware.
         */
        use<R extends IRequest<any, any, any>>(callback: (req: R, res: IResponse, next: MiddlewareNext) => void): void;

        /**
         * Registers the middleware callback to the specific route.
         * 
         * @param route Route where the middleware should be used.
         * @param callback Callback to execute as middleware.
         */
        use<R extends IRequest<any, any, any>>(route: string, callback: (req: R, res: IResponse, next: MiddlewareNext) => void): void;

        /**
         * Registers the GET endpoint without a version and with default options.
         * @param route Route of the endpoint.
         * @param callback Callback to execute.
         */
        get<R extends IRequest<any, any, any>>(route: string, callback: RouteCallback<R>): Endpoint<R>;
        /**
         * Registers the GET endpoint without a version.
         * @param route Route of the endpoint.
         * @param options Options of the endpoint.
         * @param callback Callback to execute.
         */
        get<R extends IRequest<any, any, any>>(route: string, options: RouteOptions, callback: RouteCallback<R>): Endpoint<R>;
        /**
         * Registers the GET endpoint with default options.
         * @param version Version of the endpoint.
         * @param route Route of the endpoint.
         * @param callback Callback to execute.
         */
        get<R extends IRequest<any, any, any>>(version: number, route: string, callback: RouteCallback<R>): Endpoint<R>;
        /**
         * Registers the GET endpoint.
         * @param version Version of the endpoint.
         * @param route Route of the endpoint.
         * @param options Options of the endpoint.
         * @param callback Callback to execute.
         */
        get<R extends IRequest<any, any, any>>(version: number, route: string, options: RouteOptions, callback: RouteCallback<R>): Endpoint<R>;

        /**
         * Registers the PUT endpoint without a version and with default options.
         * @param route Route of the endpoint.
         * @param callback Callback to execute.
         */
        put<R extends IRequest<any, any, any>>(route: string, callback: RouteCallback<R>): Endpoint<R>;
        /**
         * Registers the PUT endpoint without a version.
         * @param route Route of the endpoint.
         * @param options Options of the endpoint.
         * @param callback Callback to execute.
         */
        put<R extends IRequest<any, any, any>>(route: string, options: RouteOptions, callback: RouteCallback<R>): Endpoint<R>;
        /**
         * Registers the PUT endpoint with default options.
         * @param version Version of the endpoint.
         * @param route Route of the endpoint.
         * @param callback Callback to execute.
         */
        put<R extends IRequest<any, any, any>>(version: number, route: string, callback: RouteCallback<R>): Endpoint<R>;
        /**
         * Registers the PUT endpoint.
         * @param version Version of the endpoint.
         * @param route Route of the endpoint.
         * @param options Options of the endpoint.
         * @param callback Callback to execute.
         */
        put<R extends IRequest<any, any, any>>(version: number, route: string, options: RouteOptions, callback: RouteCallback<R>): Endpoint<R>;

        /**
         * Registers the POST endpoint without a version and with default options.
         * @param route Route of the endpoint.
         * @param callback Callback to execute.
         */
        post<R extends IRequest<any, any, any>>(route: string, callback: RouteCallback<R>): Endpoint<R>;
        /**
         * Registers the POST endpoint without a version.
         * @param route Route of the endpoint.
         * @param options Options of the endpoint.
         * @param callback Callback to execute.
         */
        post<R extends IRequest<any, any, any>>(route: string, options: RouteOptions, callback: RouteCallback<R>): Endpoint<R>;
        /**
         * Registers the POST endpoint with default options.
         * @param version Version of the endpoint.
         * @param route Route of the endpoint.
         * @param callback Callback to execute.
         */
        post<R extends IRequest<any, any, any>>(version: number, route: string, callback: RouteCallback<R>): Endpoint<R>;
        /**
         * Registers the POST endpoint.
         * @param version Version of the endpoint.
         * @param route Route of the endpoint.
         * @param options Options of the endpoint.
         * @param callback Callback to execute.
         */
        post<R extends IRequest<any, any, any>>(version: number, route: string, options: RouteOptions, callback: RouteCallback<R>): Endpoint<R>;

        /**
         * Registers the DELETE endpoint without a version and with default options.
         * @param route Route of the endpoint.
         * @param callback Callback to execute.
         */
        delete<R extends IRequest<any, any, any>>(route: string, callback: RouteCallback<R>): Endpoint<R>;
        /**
         * Registers the DELETE endpoint without a version.
         * @param route Route of the endpoint.
         * @param options Options of the endpoint.
         * @param callback Callback to execute.
         */
        delete<R extends IRequest<any, any, any>>(route: string, options: RouteOptions, callback: RouteCallback<R>): Endpoint<R>;
        /**
         * Registers the DELETE endpoint with default options.
         * @param version Version of the endpoint.
         * @param route Route of the endpoint.
         * @param callback Callback to execute.
         */
        delete<R extends IRequest<any, any, any>>(version: number, route: string, callback: RouteCallback<R>): Endpoint<R>;
        /**
         * Registers the DELETE endpoint.
         * @param version Version of the endpoint.
         * @param route Route of the endpoint.
         * @param options Options of the endpoint.
         * @param callback Callback to execute.
         */
        delete<R extends IRequest<any, any, any>>(version: number, route: string, options: RouteOptions, callback: RouteCallback<R>): Endpoint<R>;

        /**
         * Registers the API endpoint route without a version and with default options.
         * @param method HTTP method of the route.
         * @param route Route of the endpoint.
         * @param callback Callback to execute.
         */
        registerRoute<R extends IRequest<any, any, any>>(method: string, route: string, callback: RouteCallback<R>): Endpoint<R>;
        /**
         * Registers the API endpoint route without a version.
         * @param method HTTP method of the route.
         * @param route Route of the endpoint.
         * @param options Options of the endpoint.
         * @param callback Callback to execute.
         */
        registerRoute<R extends IRequest<any, any, any>>(method: string, route: string, options: RouteOptions, callback: RouteCallback<R>): Endpoint<R>;
        /**
         * Registers the API endpoint route.
         * @param method HTTP method of the route.
         * @param version Version of the endpoint.
         * @param route Route of the endpoint.
         * @param options Options of the endpoint.
         * @param callback Callback to execute.
         */
        registerRoute<R extends IRequest<any, any, any>>(method: string, version: number, route: string, options: RouteOptions, callback: RouteCallback<R>): Endpoint<R>;

        /**
         * Registers the API endpoint route. 
         * @param method HTTP method of the route.
         * @param version Version of the endpoint.
         * @param route Route of the endpoint.
         * @param requireAuth If true the endpoint requires an authorization.
         * @param params Definition of endpoint params.
         * @param descripton Description of the ednpoint.
         * @param callback Callback to execute.
         * @deprecated
         */
        registerRoute<R extends IRequest<any, any, any>>(method: string, version: number, route: string, requireAuth: boolean, params: any, descripton: string, callback: RouteCallback<R>): Endpoint<R>;

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
    }

    class Route {
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

    class Endpoint<R extends IRequest<any, any, any> = any> {

        version: number;
        requiredAuth: boolean;
        params: Param[];
        response: Array<Field | FieldShape | FieldShapeArray>;
        errors: ErrorField[];
        description: string;
        hideDocs: boolean;
        callback: RouteCallback<R>;
        route: Route;
        deprecated: boolean;
        apiKeyEnabled: boolean;
        excludedApiKeys: (() => Promise<string[]>) | string[];
        timeout: number;

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
            /** List of params of the endpoint. */
            params?: Param[] | string[],
            /** List of response fields. */
            response?: Array<Field | FieldShape | FieldShapeArray>,
            /** List of errors that the endpoint can return. */
            errors?: ErrorField[] | string[],
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
         * Gets the map of arguments specified in the Route.
         */
        getRouteArguments(): { [key: string]: Field };
        /**
         * Gets the map of the errors.
         */
        getErrors(): { [key: string]: ErrorField };
        /**
         * Gets the list or map of the errors.
         * @param array If true the returned value is array of errors. Otherwise it is the map of the errors.
         */
        getErrors(array: boolean): ErrorField[] | { [key: string]: ErrorField };
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
        deprecate(): Endpoint<R>;
        /**
         * Sets the endpoint as requiring auth.
         * @deprecated
         */
        auth(): Endpoint<R>;
        /**
         * Sets the description.
         * @param docs Endpoint description.
         * @deprecated
         */
        setDocs(docs: string): Endpoint<R>;
    }

    class FieldShape {
        name: string;
        description: string;
        fields: Field[];
        type: Type;
        constructor(name: string, ...fields: Array<Field | FieldShape | FieldShapeArray>);
        constructor(name: string, description: string, ...fields: Array<Field | FieldShape | FieldShapeArray>);
        toJSON(): { name: string, description: string, shape: { [key: string]: Field }, type: string };
    }

    class FieldShapeArray {
        name: string;
        description: string;
        shape: FieldShape;
        type: Type;
        constructor(name: string, ...fields: Array<Field | FieldShape | FieldShapeArray>);
        constructor(name: string, description: string, ...fields: Array<Field | FieldShape | FieldShapeArray>);
        toJSON(): { name: string, description: string, shape: { [key: string]: Field }, type: string };
    }

    class Field {

        static Shape: typeof FieldShape;

        static ShapeArray: typeof FieldShapeArray;

        static create(param: string | { name: string, type?: Type, description?: string }): Field;

        key: string;

        name: string;

        type: Type;

        description: string;

        constructor(name: string);

        constructor(name: string, type: Type);

        constructor(name: string, type: Type, description: string);

        toJSON(): { name: string, key: string, description: string, type: string };
    }

    class ParamShape extends FieldShape {
        required: boolean;
        constructor(name: string, required: boolean, ...fields: Array<Field | FieldShape | FieldShapeArray | Param | ParamShape | ParamShapeArray>);
        constructor(name: string, required: boolean, description: string, ...fields: Array<Field | FieldShape | FieldShapeArray | Param | ParamShape | ParamShapeArray>);
        toJSON(): { name: string, description: string, shape: { [key: string]: Field }, type: string, required: boolean };
    }

    class ParamShapeArray extends FieldShapeArray {
        required: boolean;
        constructor(name: string, required: boolean, ...fields: Array<Field | FieldShape | FieldShapeArray | Param | ParamShape | ParamShapeArray>);
        constructor(name: string, required: boolean, description: string, ...fields: Array<Field | FieldShape | FieldShapeArray | Param | ParamShape | ParamShapeArray>);
        toJSON(): { name: string, description: string, shape: { [key: string]: Field }, type: string, required: boolean };
    }

    class Param /* extends Field */ {

        static Shape: typeof ParamShape;

        static ShapeArray: typeof ParamShapeArray;

        static createFromField(field: Field, required?: boolean): Param;

        static create(param: string | { name: string, type?: Type, description?: string, required?: boolean }): Param;

        key: string;

        name: string;

        type: Type;

        description: string;

        required: boolean;

        constructor(name: string);

        constructor(name: string, required: boolean);

        constructor(name: string, required: boolean, type: Type);

        constructor(name: string, required: boolean, type: Type, description: string);

        toJSON(): { name: string, key: string, description: string, type: string, required: boolean };
    }

    class ErrorField {
        /** Error code. */
        code: string;
        /** Description of the situations where the error is returned. */
        description: string;
        /**
         * 
         * @param code Error code.
         */
        constructor(code: string);
        /**
         * 
         * @param code Error code.
         * @param description Description of the situations where the error is returned.
         */
        constructor(code: string, description: string);
    }

    class Benchmark {

        total: number;
        private _name: string;
        private _map: { [label: string]: Date };
        private _started: boolean;
        constructor();
        constructor(name: string);
        start(): this;
        mark(label: string): this;
        toJSON(): { [label: string]: number, total: number };
    }

    export {
        RuntimeType as Type,
        SmartError as Error,
        HttpSmartError as HttpError,
        ErrorField,
        Param,
        Field,
        Endpoint,
        IRequest,
        IAppOptions,
    }

    export type App = Application;

    export default function (options?: IAppOptions): Application;
}