import RSBaseError from '../base';

export default class TimeoutError extends RSBaseError {

	getDescription() {
		return 'Returned if the request timed out.';
	}

	_getStatusCode() {
		return RSBaseError.REQUEST_TIMEOUT;
	}
}
