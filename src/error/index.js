import RSBaseError from './base';

import InvalidType from './invalid-type';

export default class RSError extends RSBaseError {

	static InvalidType = InvalidType;
}
