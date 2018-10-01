declare module 'resting-squirrel' {

    import SmartError from 'smart-error';
    import HttpSmartError from 'http-smart-error';
    import RuntimeType from 'runtime-type';

    type Type = RuntimeType.Type;

    type RouteCallback = (req: any, res: any, next: (error?: HttpSmartError | SmartError | Error | string | null, data?: any) => void) => void | Promise<any>;

    type MiddlewareNext = (error?: HttpSmartError | SmartError | Error | string | null) => void;

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
    }

    class Application {

        version: string;

        /**
         * Registers the middleware callback to all routes.
         * 
         * @param callback Callback to execute as middleware.
         */
        use(callback: (req: any, res: any, next: Function) => void): void;

        /**
         * Registers the middleware callback to the specific route.
         * 
         * @param route Route where the middleware should be used.
         * @param callback Callback to execute as middleware.
         */
        use(route: string, callback: (req: any, res: any, next: Function) => void): void;

        get(route: string, callback: RouteCallback): Endpoint;
        get(route: string, options: RouteOptions, callback: RouteCallback): Endpoint;
        get(version: number, route: string, callback: RouteCallback): Endpoint;
        get(version: number, route: string, options: RouteOptions, callback: RouteCallback): Endpoint;

        put(route: string, callback: RouteCallback): Endpoint;
        put(route: string, options: RouteOptions, callback: RouteCallback): Endpoint;
        put(version: number, route: string, callback: RouteCallback): Endpoint;
        put(version: number, route: string, options: RouteOptions, callback: RouteCallback): Endpoint;

        post(route: string, callback: RouteCallback): Endpoint;
        post(route: string, options: RouteOptions, callback: RouteCallback): Endpoint;
        post(version: number, route: string, callback: RouteCallback): Endpoint;
        post(version: number, route: string, options: RouteOptions, callback: RouteCallback): Endpoint;

        delete(route: string, callback: RouteCallback): Endpoint;
        delete(route: string, options: RouteOptions, callback: RouteCallback): Endpoint;
        delete(version: number, route: string, callback: RouteCallback): Endpoint;
        delete(version: number, route: string, options: RouteOptions, callback: RouteCallback): Endpoint;

        registerRoute(method: string, route: string, callback: RouteCallback): Endpoint;
        registerRoute(method: string, route: string, options: RouteOptions, callback: RouteCallback): Endpoint;
        registerRoute(method: string, version: number, route: string, options: RouteOptions, callback: RouteCallback): Endpoint;

        /** @deprecated */
        registerRoute(method: string, version: number, route: string, requireAuth: boolean, params: any, descripton: string, callback: RouteCallback): Endpoint;

        /**
         * Starts the application.
         * 
         * @param cb Callback called after the app is listening.
         * @deprecated
         */
        listen(cb?: Function): void;

        /**
         * Starts the application.
         * 
         * @param cb Callback called after the app is listening.
         */
        start(cb?: Function): void;
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

    class Endpoint {

        version: number;
        requiredAuth: boolean;
        params: Param[];
        response: Array<Field | FieldShape | FieldShapeArray>;
        errors: ErrorField[];
        description: string;
        hideDocs: boolean;
        callback: RouteCallback;
        route: Route;
        deprecated: boolean;
        apiKeyEnabled: boolean;

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
            callback?: RouteCallback,
            /** If true the parameters are validated for invalid types. */
            validateParams?: boolean,
            /** If false the api key is not required. */
            apiKeyEnabled?: boolean,
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
         * Sets the endpoint as deprecated.
         */
        deprecate(): Endpoint;
        /**
         * Sets the endpoint as requiring auth.
         * @deprecated
         */
        auth(): Endpoint;
        /**
         * Sets the description.
         * @param docs Endpoint description.
         * @deprecated
         */
        setDocs(docs: string): Endpoint;
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

    export {
        RuntimeType as Type,
        SmartError as Error,
        HttpSmartError as HttpError,
        ErrorField,
        Param,
        Field,
        Endpoint,
    }

    export default function (options?: {
        /** Port number where the app listens */
        port?: number,
        /** Name of the app. */
        name?: string,
        /** Key in response where the data are stored. */
        dataKey?: string,
        /** Key in response where the error is stored. */
        errorKey?: string,
        /** If true the app is logging. */
        log?: boolean,
        /** If true the app is logging the stack trace if error occures. */
        logStack?: boolean,
        /** Function to log a data. The `log` option must be set to true to call it. */
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
        auth?: (req: any, res: any, next: MiddlewareNext) => void | {
            /** Header key where the authorization token is located. */
            key?: string,
            /** Description of the authorization process. */
            description?: string,
            /** Validator function executed while validating authorization token in the endpoint lifecycle. */
            validator?: (key: string, req: any, res: any, next: MiddlewareNext) => void,
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
            validator?: (apiKey: string, next: MiddlewareNext) => void,
        },
        /** Methods called before the endpoint callback execution. */
        before?: ((req: any, res: any, next: MiddlewareNext) => void) | {
            [route: string]: (req: any, res: any, next: MiddlewareNext) => void,
        },
        /**
         * Methods to call after the endpopint callback execution.
         */
        after?: ((isError: boolean, data: any, req: any, res: any, next: MiddlewareNext) => void) | {
            [route: string]: (isError: boolean, data: any, req: any, res: any, next: MiddlewareNext) => void,
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
    }): Application;
}