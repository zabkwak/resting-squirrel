import RSBaseError from '../base';

export default class InvalidAccessTokenError extends RSBaseError {

	getDescription() {
		return 'Returned if header with access token is not valid.';
	}

	_getCode() {
		return 'invalid_access_token';
	}

	_getStatusCode() {
		return RSBaseError.FORBIDDEN;
	}

	_getMessage() {
		return 'Access token is invalid.';
	}
}
