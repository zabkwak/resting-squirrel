export default class Error {
    
    code = null;
    description = null;

    constructor(code, description = null) {
        this.code = code;
        this.description = description;
    }
}
