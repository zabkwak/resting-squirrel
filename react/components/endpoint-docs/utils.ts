import Type, { ArrayOf, Shape } from 'runtime-type';
import { IField, IParam } from '../../typings';

export const getDocsProperty = (key: string, field: IField | IParam): string => {
	const t = Type.fromString(field.type);
	const propertyKey = 'required' in field ? `${key}${field.required ? '' : '?'}` : key;
	if (t instanceof Shape && key in field) {
		// @ts-expect-error
		const shape = field[key] as Record<string, IField | IParam>;
		// t.
		return `/**
 * ${field.description}
 */
${propertyKey}: {
${prependTabs(
	Object.entries(shape)
		.map(([key, field]) => getDocsProperty(key, field))
		.join('\n'),
	1,
)}
};`;
	}
	// @ts-expect-error
	if (t instanceof ArrayOf && t._type instanceof Shape && key in field) {
		// @ts-expect-error
		const shapeArray = field[key] as Record<string, IField | IParam>;
		return `/**
 * ${field.description}
 */
${propertyKey}: {
${prependTabs(
	Object.entries(shapeArray)
		.map(([key, field]) => getDocsProperty(key, field))
		.join('\n'),
	1,
)}	
}[];`;
	}
	return `/**
 * ${field.description}
 */
${propertyKey}: ${t.getTSType(true)};`;
};

const prependTabs = (str: string, tabs: number): string => {
	return str
		.split('\n')
		.map((row) => `${'\t'.repeat(tabs)}${row}`)
		.join('\n');
};
