export default class ResponseResponse {

    getContentType(charset) {
        return `text/html; charset=${charset}`;
    }

    getData(data, pretty = false) {
        return data;
    }

    get(array = false) {
        throw new Error('Not implemented');
    }
}