declare module 'resting-squirrel' {

    type RouteCallback = (req: any, res: any, next: (error: any, data: any) => void) =>void;

    export class Field { }

    export class Param extends Field { }

    export class ErrorField { }

    interface RouteOptions {
        requireAuth?: boolean,
        params?: Param[] | string[],
        response?: Field[],
        errors?: ErrorField[] | string[],
        description?: string,
        hideDocs?: boolean,
        args?: Field[],
        requireApiKey?: boolean,
    }

    class Endpoint { }

    class Application {

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

        registerRoute(method: string, version: number, route: string, options: RouteOptions, callback: RouteCallback): Endpoint;
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

    export default function (options?: {
        /** Port number where the app listens */
        port?: number,
        name?: string,
        dataKey?: string,
        errorKey?: string,
        log?: boolean,
        logStack?: boolean,
        logger?: Function,
        meta?: {
            enabled?: boolean,
            data?: { [key: string]: any },
        },
        requestLimit?: string,
        docs?: any, // TODO
        auth?: any, // TODO
        apiKey?: any, // TODO
        before?: any, // TODO
        after?: any, // TODO
        defaultError?: any, // TODO
        validateParams?: boolean,
        responseStrictValidation?: boolean,
    }): Application;
}