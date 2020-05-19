import * as React from 'react';
import { Typography, Button, TypographyProps } from '@material-ui/core';
import { Link } from '@material-ui/icons';
import Application from './app';

interface IProps {
	link: string;
	component: React.ElementType<any>;
	variant: TypographyProps['variant'];
}

export default class Title extends React.Component<Partial<IProps>> {

	public static defaultProps: IProps = {
		link: null,
		component: null,
		variant: 'h5',
	};

	public render(): JSX.Element {
		const { children, link, component, variant } = this.props;
		return (
			<Typography
				variant={variant}
				id={link || undefined}
				component={component}
				ref={link ? (ref: any) => Application.registerRef(link, ref) : undefined}
			>
				{children}
				{
					link &&
					<Button
						size="small"
						onClick={() => {
							Application.navigate({ anchor: link });
						}}
					>
						<Link />
					</Button>
				}
			</Typography>
		);
	}
}