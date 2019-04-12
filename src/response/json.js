import Base from './base';

export default class JSONResponse extends Base {

    fields = [];

    constructor(fields = []) {
        super();
        this.fields = fields;
    }

    getContentType(charset) {
        return `application/json; charset=${charset}`;
    }

    getData(data, pretty = undefined) {
        return JSON.stringify(data, null, pretty === undefined ? 0 : 4);
    }

    get(array = false) {
        if (array) {
            return this.fields;
        }
        const o = {};
        this.fields.forEach(p => o[p.name] = p);
        return o;
    }
}
