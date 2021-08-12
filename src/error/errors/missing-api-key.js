import RSBaseError from '../base';

export default class MissingApiKeyError extends RSBaseError {

	getDescription() {
		return 'Returned if the api key is missing in the request.';
	}

	_getCode() {
		return 'missing_api_key';
	}

	_getStatusCode() {
		return RSBaseError.FORBIDDEN;
	}

	_getMessage() {
		return 'Api key is missing.';
	}
}
