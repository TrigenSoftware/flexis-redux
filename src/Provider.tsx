import React, {
	Component,
	Fragment
} from 'react';
import PropTypes from 'prop-types';
import Store, { IStoreActions } from './Store';
import StoreContext from './StoreContext';

const {
	Provider: StoreContextProvider
} = StoreContext;

interface IProps {
	store: Store;
	children: any;
}

interface IState {
	storeState: any;
	actions: IStoreActions;
}

export default class Provider extends Component<IProps, IState> {

	static propTypes = {
		store:    PropTypes.instanceOf(Store).isRequired,
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
			storeState, // eslint-disable-line
			actions // eslint-disable-line
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
	function getDerivedStateFromProps({ store }: IProps, {
		storeState: prevStoreState,
		actions: prevActions
	}: IState): IState {

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
