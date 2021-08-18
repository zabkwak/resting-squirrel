import RSBaseError from './base';
import InvalidParameterTypeError from './errors/invalid-parameter-type';
import InvalidArgumentTypeError from './errors/invalid-argument-type';
import InvalidInputTypeError from './errors/invalid-input-type';
import MissingParameterError from './errors/missing-parameter';
import MissingApiKeyError from './errors/missing-api-key';
import InvalidApiKeyError from './errors/invalid-api-key';
import InvalidAccessTokenError from './errors/invalid-access-token';
import MissingAccessTokenError from './errors/missing-access-token';
import TimeoutError from './errors/timeout';
import NotFoundError from './errors/not-found';

/**
 * Base error class for creating errors for endpoints.
 */
export default class RSError extends RSBaseError {

	public static InvalidParameterType: typeof InvalidParameterTypeError;
	public static InvalidArgumentType: typeof InvalidArgumentTypeError;
	public static InvalidInputType: typeof InvalidInputTypeError;
	public static MissingParameter: typeof MissingParameterError;
	public static MissingApiKey: typeof MissingApiKeyError;
	public static InvalidApiKey: typeof InvalidApiKeyError;
	public static InvalidAccessToken: typeof InvalidAccessTokenError;
	public static MissingAccessToken: typeof MissingAccessTokenError;
	public static Timeout: typeof TimeoutError;
	public static NotFound: typeof NotFoundError;
}
