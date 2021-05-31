export default class ErrorField {
    
    code = null;
    description = null;

    constructor(code, description = null) {
        this.code = code;
        this.description = description;
    }
}
