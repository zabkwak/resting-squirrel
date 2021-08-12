import RSBaseError from '../base';

export default class InvalidApiKeyError extends RSBaseError {

	getDescription() {
		return 'Returned if the api key is not valid.';
	}

	_getCode() {
		return 'invalid_api_key';
	}

	_getStatusCode() {
		return RSBaseError.FORBIDDEN;
	}

	_getMessage() {
		return 'Api key is invalid.';
	}
}
