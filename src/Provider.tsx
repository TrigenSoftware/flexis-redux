import React, {
	Component,
	Fragment
} from 'react';
import PropTypes from 'prop-types';
import Store from './Store';
import StoreContext from './StoreContext';

interface IProps {
	store: Store;
}

interface IState {
	storeState: any;
	actions: any;
}

const {
	Provider: StoreContextProvider
} = StoreContext;

export default class Provider extends Component<IProps, IState> {

	static propTypes = {
		store: PropTypes.instanceOf(Store).isRequired,
		children: PropTypes.any.isRequired
	};

	private unsubscribe: () => void = null;

	constructor(props: IProps) {

		super(props);

		const {
			state: storeState,
			actions
		} = props.store;

		this.state = {
			storeState,
			actions
		};
	}

	render() {

		const {
			children
		} = this.props;

		return (
			<StoreContextProvider value={this.state}>
				<Fragment>
					{children}
				</Fragment>
			</StoreContextProvider>
		);
	}

	componentDidMount() {

		const {
			store
		} = this.props;

		this.unsubscribe = store.subscribe(() => {
			this.setState(() => ({
				storeState: store.state
			}));
		});
	}

	componentWillUnmount() {
		this.unsubscribe();
	}
}

if (process.env.NODE_ENV !== 'production') {

	(Provider as any).getDerivedStateFromProps =
	function getDerivedStateFromProps(
		{ store }: IProps,
		{
			storeState: prevStoreState,
			actions: prevActions
		}: IState
	): IState {

		const {
			state: storeState,
			actions
		} = store;

		if (storeState === prevStoreState
			&& actions === prevActions
		) {
			return null;
		}

		return {
			storeState,
			actions
		};
	};

	Provider.prototype.componentDidUpdate =
	function componentDidUpdate({ store: prevStore }: IProps) {

		const {
			store
		} = this.props as IProps;

		if (prevStore !== store) {
			prevStore.destroy();
			this.unsubscribe = store.subscribe(() => {
				this.setState(() => ({
					storeState: store.state
				}));
			});
		}
	};
}
