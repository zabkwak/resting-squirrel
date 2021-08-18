import HttpSmartError from 'http-smart-error';

export default class RSBaseError extends HttpSmartError {

	static toErrorField() {
		const e = new this();
		return e.toErrorField();
	}

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

	toErrorField() {
		return {
			code: this.code,
			description: this.getDescription(),
		};
	}

	getDescription() {
		return null;
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
