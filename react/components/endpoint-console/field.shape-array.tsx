import * as React from 'react';
import { Button, Box } from '@material-ui/core';
import CrossIcon from '@material-ui/icons/Cancel';

import Field from './field';
import { IField } from '../../typings';

interface IOptionalProps {
	disabled: boolean;
	params: boolean;
	level: number;
}

interface IProps extends Partial<IOptionalProps> {
	shape: IField['shape'];
	values: Array<{ [key: string]: any }>;
	onValuesChange: (value: { [key: string]: any }) => void;
}

export default class ShapeArrayField extends React.Component<IProps> {

	public static defaultProps: IOptionalProps = {
		disabled: false,
		level: 0,
		params: false,
	};

	public render(): JSX.Element {
		const { shape, disabled, values, onValuesChange, level, params } = this.props;
		return (
			<>
				{
					values.map((value, index) => (
						<Box display="flex" flexDirection="row" key={index}>
							<Box flexGrow="1">
								<Field
									name={`Element ${index}`}
									disabled={disabled}
									type="shape"
									value={value}
									onValueChanged={(value) => {
										values[index] = value;
										if (typeof onValuesChange === 'function') {
											onValuesChange(values);
										}
									}}
									level={level + 1}
									params={params}
									shape={shape}
								/>
							</Box>
							{
								values.length > 1 &&
								<Button
									size="small"
									color="secondary"
									onClick={() => {
										values.splice(index, 1);
										if (typeof onValuesChange === 'function') {
											onValuesChange(values);
										}
									}}
									disabled={disabled}
								>
									<CrossIcon />
								</Button>
							}
						</Box>
					))
				}
				<Button
					onClick={() => {
						values.push({});
						if (typeof onValuesChange === 'function') {
							onValuesChange(values);
						}
					}}
					disabled={disabled}
				>
					Add element
				</Button>
			</>
		);
	}
}
