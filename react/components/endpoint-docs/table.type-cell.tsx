import * as React from 'react';
import { Typography, TableCell, Link, Button } from '@material-ui/core';

import { IField, IParam } from '../../typings';

import Table from './table';

interface IOptionalProps {
	params: boolean;
}

interface IProps extends Partial<IOptionalProps> {
	field: IField | IParam;
}

interface IState {
	expanded: boolean;
}

export default class TableTypeCell extends React.Component<IProps, IState> {

	public static defaultProps: IOptionalProps = {
		params: false,
	};

	public state: IState = {
		expanded: false,
	};

	// TODO refactor
	public render(): JSX.Element {
		const { field, params } = this.props;
		const { expanded } = this.state;
		if (field.shape) {
			return (
				<TableCell>
					<Typography>
						Shape
						<Button
							onClick={(e) => {
								e.preventDefault();
								this.setState({ expanded: !expanded });
							}}
						>
							{expanded ? 'Hide' : 'Show'}
						</Button>
					</Typography>
					{
						expanded &&
						<Table
							items={Object.entries(field.shape).map(([_, item]) => item)}
							params={params}
						/>
					}
				</TableCell>
			);
		}
		if (field.shape_array) {
			return (
				<TableCell>
					<Typography>
						Shape[]
						<Button
							onClick={(e) => {
								e.preventDefault();
								this.setState({ expanded: !expanded });
							}}
						>
							{expanded ? 'Hide' : 'Show'}
						</Button>
					</Typography>
					{
						expanded &&
						<Table
							items={Object.entries(field.shape_array).map(([_, item]) => item)}
							params={params}
						/>
					}
				</TableCell>
			);
		}
		return (
			<TableCell>
				{field.type}
			</TableCell>
		);
	}
}
