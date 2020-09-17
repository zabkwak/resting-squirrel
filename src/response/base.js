export default class ResponseResponse {

	_headers = {};

	getContentType(charset) {
		return `text/html; charset=${charset}`;
	}

	getData(data, pretty = false) {
		return data;
	}

	get(array = false) {
		throw new Error('Not implemented');
	}

	getHeaders() {
		return this._headers;
	}

	addHeader(header, value) {
		this._headers[header] = value;
		return this;
	}
}