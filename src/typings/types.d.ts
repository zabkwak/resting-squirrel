import RuntimeType, { Model } from 'runtime-type';
import SmartError from 'smart-error';
import HttpSmartError from 'http-smart-error';
import { IRequest, IResponse } from './interfaces';

export type TError = HttpSmartError | SmartError | Error | string | null;

export type Type = RuntimeType.Type;

export type MiddlewareNext = (error?: TError) => void;

export type RouteCallback<R extends IRequest<any, any, any, any>> = (
	req: R,
	res: IResponse,
	next: (error?: TError, data?: any) => void,
) => void | Promise<any>;
