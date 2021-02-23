import * as React from 'react';
import { Table as MuiTable, TableHead, TableBody, TableRow, TableCell } from '@material-ui/core';
import CheckedIcon from '@material-ui/icons/CheckCircle';
import CrossIcon from '@material-ui/icons/Cancel';

const { Parser }: any = require('html-to-react');

import { IField, IParam } from '../../typings';

import TableTypeCell from './table.type-cell';

interface IOptionalProps {
	params: boolean;
}

interface IProps extends Partial<IOptionalProps> {
	items: Array<IField | IParam>;
}

const parser = new Parser();

export default class Table extends React.Component<IProps> {

	public static defaultProps: IOptionalProps = {
		params: false,
	};

	public render(): JSX.Element {
		const { items, params } = this.props;
		return (
			<MuiTable>
				<TableHead>
					<TableRow>
						<TableCell component="th">Name</TableCell>
						<TableCell component="th">Type</TableCell>
						<TableCell component="th">Description</TableCell>
						<TableCell component="th">{params ? 'Required' : ''}</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{
						items.map((field) => (
							<TableRow
								key={field.name}
								hover
							>
								<TableCell>{field.name}</TableCell>
								<TableTypeCell field={field} params={params} />
								<TableCell>{parser.parse(field.description)}</TableCell>
								<TableCell>
									{
										params
											? (field as IParam).required ? <CheckedIcon /> : <CrossIcon />
											: ''
									}
								</TableCell>
							</TableRow>
						))
					}
				</TableBody>
			</MuiTable>
		);
	}
}
