import HttpSmartError from 'http-smart-error';
import ErrorField from './endpoint/error-field';

export default class RSError extends HttpSmartError {

	constructor(message = null, payload = null) {
		super();
		const e = HttpSmartError.create(this._getStatusCode(), message || this._getMessage(), this._getCode());
		this.statusCode = e.statusCode;
		this.message = e.message;
		this.code = e.code;
		if (payload) {
			this._setPayload(payload);
		}
	}

	getDescription() {
		return null;
	}

	toErrorField() {
		return new ErrorField(this.code, this.getDescription());
	}

	_getStatusCode() {
		return 500;
	}

	_getCode() {
		return null;
	}

	_getMessage() {
		return null;
	}
}
