import RSBaseError from './base';

import InvalidParameterType from './errors/invalid-parameter-type';
import InvalidArgumentType from './errors/invalid-argument-type';
import InvalidInputTypeError from './errors/invalid-input-type';
import MissingParameterError from './errors/missing-parameter';
import MissingApiKeyError from './errors/missing-api-key';
import InvalidApiKeyError from './errors/invalid-api-key';
import InvalidAccessTokenError from './errors/invalid-access-token';
import MissingAccessTokenError from './errors/missing-access-token';
import TimeoutError from './errors/timeout';
import NotFoundError from './errors/not-found';

export default class RSError extends RSBaseError {

	static InvalidParameterType = InvalidParameterType;
	static InvalidArgumentType = InvalidArgumentType;
	static InvalidInputType = InvalidInputTypeError;
	static MissingParameter = MissingParameterError;
	static MissingApiKey = MissingApiKeyError;
	static InvalidApiKey = InvalidApiKeyError;
	static InvalidAccessToken = InvalidAccessTokenError;
	static MissingAccessToken = MissingAccessTokenError;
	static Timeout = TimeoutError;
	static NotFound = NotFoundError;
}
