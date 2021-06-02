import { Type } from '../typings/types';

export class FieldShape {
	name: string;
	description: string;
	fields: Field[];
	type: Type;
	constructor(name: string, ...fields: Array<Field | FieldShape | FieldShapeArray>);
	constructor(name: string, description: string, ...fields: Array<Field | FieldShape | FieldShapeArray>);
	toJSON(): { name: string, description: string, shape: { [key: string]: Field }, type: string };
}

export class FieldShapeArray {
	name: string;
	description: string;
	shape: FieldShape;
	type: Type;
	constructor(name: string, ...fields: Array<Field | FieldShape | FieldShapeArray>);
	constructor(name: string, description: string, ...fields: Array<Field | FieldShape | FieldShapeArray>);
	toJSON(): { name: string, description: string, shape: { [key: string]: Field }, type: string };
}

export default class Field {

	static Shape: typeof FieldShape;

	static ShapeArray: typeof FieldShapeArray;

	static create(param: string | { name: string, type?: Type, description?: string }): Field;

	key: string;

	name: string;

	type: Type;

	description: string;

	constructor(name: string);

	constructor(name: string, type: Type);

	constructor(name: string, type: Type, description: string);

	toJSON(): { name: string, key: string, description: string, type: string };
}