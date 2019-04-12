import BaseResponse from './base';

export default class CustomResponse extends BaseResponse {

    _contentType = null;

    constructor(contentType) {
        super();
        this._contentType = contentType;
    }

    getContentType(charset) {
        return this._contentType;
    }

    get(array = false) {
        return array ? [] : {};
    }

    getData(data) {
        return data.data;
    }
}