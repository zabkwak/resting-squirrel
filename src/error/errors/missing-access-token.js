import RSBaseError from '../base';

export default class MissingAccessTokenError extends RSBaseError {

	getDescription() {
		return 'Returned if header with access token is missing.';
	}

	_getCode() {
		return 'missing_access_token';
	}

	_getStatusCode() {
		return RSBaseError.UNAUTHORIZED;
	}

	_getMessage() {
		return 'The access token is missing.';
	}
}
