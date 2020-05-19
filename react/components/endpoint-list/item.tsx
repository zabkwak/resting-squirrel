import * as React from 'react';
import { ListItem, ListItemText, Tooltip, IconButton } from '@material-ui/core';
import classnames from 'classnames';
import { Lock as LockIcon, LockOpen } from '@material-ui/icons';

import { IDocsItem } from '../../typings';

import './item.scss';

interface IOptionalProps {
	deprecated: boolean;
	selected: boolean;
	auth: IDocsItem['auth'];
	onClick: () => void;
};

interface IProps extends Partial<IOptionalProps> {
	name: string;
}

export default class Item extends React.Component<IProps> {

	public static defaultProps: IOptionalProps = {
		deprecated: false,
		selected: false,
		auth: 'DISABLED',
		onClick: null,
	};

	public render(): JSX.Element {
		const { name, deprecated, selected, auth, onClick } = this.props;
		return (
			<Tooltip
				title={name}
			>
				<ListItem
					className={classnames(deprecated && 'deprecated')}
					button
					onClick={onClick}
					selected={selected}
				>
					<ListItemText
						primary={name}
					/>
					{
						auth !== 'DISABLED' &&
						<IconButton edge="end" aria-label="delete">
							{auth === 'REQUIRED' && <LockIcon />}
							{auth === 'OPTIONAL' && <LockOpen />}
						</IconButton>
					}
				</ListItem>
			</Tooltip>
		);
	}
}
