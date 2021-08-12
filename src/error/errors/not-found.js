import RSBaseError from '../base';

export default class NotFoundError extends RSBaseError {

	getDescription() {
		return 'Returned if the resource is not found.';
	}

	_getStatusCode() {
		return RSBaseError.NOT_FOUND;
	}

	// TODO remove
	_getCode() {
		return 'page_not_found';
	}

	// TODO remove
	_getMessage() {
		return 'Page not found';
	}
}
