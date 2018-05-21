import SmartError from 'smart-error';

import codes from './codes.json';

/**
 * Sub-class of SmartError. The error gets http status code as a payload parameter.
 */
export default class HttpError extends SmartError {

    /**
     * @typedef CodeInfo
     * @property {string} message Error message.
     * @property {string} code Error code.
     */

    /**
     * Creates HttpError instance by error status code.
     *
     * @param {number} statusCode Http error status code.
     * @param {string} message Error message.
     * @param {string} code Error code.
     * @param {Object.<string, any>} payload Additional error data.
     */
    static create(statusCode, message = null, code = null, payload = {}) {
        const c = this.getCode(statusCode);
        if (message instanceof SmartError) {
            payload = message._parsePayload(message);
        }
        return new this(statusCode, message || c.message, code || c.code, payload);
    }

    /**
     * Gets the code info by http error status code.
     * @param {number} statusCode Http error status code.
     *
     * @returns {CodeInfo}
     */
    static getCode(statusCode) {
        return codes[statusCode] || codes[500];
    }

    /**
     * Creates new instance of http error.
     *
     * @param {number} statusCode Http error status code.
     * @param {string} message Error message.
     * @param {string} code Error code.
     * @param {Object.<string, any>} payload Additional error data.
     */
    constructor(statusCode, message, code, payload = {}) {
        super(message, code, Object.assign(payload, { statusCode }));
    }
}
