import * as React from 'react';
import { Button, Box } from '@material-ui/core';
import SubdirectoryArrowRightIcon from '@material-ui/icons/SubdirectoryArrowRight';

import Field from './field';
import { IField, IParam } from '../../typings';

interface IOptionalProps {
	disabled: boolean;
	params: boolean;
	level: number;
}

interface IProps extends Partial<IOptionalProps> {
	shape: IField['shape'];
	value: { [key: string]: any };
	onValueChange: (value: { [key: string]: any }) => void;
}

export default class ShapeField extends React.Component<IProps> {

	public static defaultProps: IOptionalProps = {
		disabled: false,
		params: false,
		level: 0,
	};

	public render(): JSX.Element {
		const { disabled, shape, onValueChange, value, params, level } = this.props;
		return (
			<>
				{
					Object.entries(shape).map(([name, field]) => (
						<Field
							key={name}
							name={name}
							type={field.type}
							required={params ? (field as IParam).required : false}
							shape={field.shape}
							shapeArray={field.shape_array}
							value={value[name]}
							onValueChanged={(v) => {
								value[name] = v;
								onValueChange(value);
							}}
							disabled={disabled}
							level={level + 1}
						/>
					))
				}
			</>
		);
	}
}
