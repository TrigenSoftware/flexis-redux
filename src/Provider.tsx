import React, {
	Component
} from 'react';
import PropTypes from 'prop-types';
import Store from './Store';
import StoreContext, {
	IContext
} from './StoreContext';

interface IProps {
	store: Store;
}

const {
	Provider: StoreContextProvider
} = StoreContext;

export default class Provider extends Component<IProps, IContext> {

	static propTypes = {
		store:    PropTypes.instanceOf(Store).isRequired,
		children: PropTypes.any.isRequired
	};

	private unsubscribe: () => void = null;

	constructor(props: IProps, context) {

		super(props, context);

		const {
			store
		} = props;
		const {
			state: storeState,
			actions,
			isEqual
		} = store;

		this.state = {
			loadSegments:      store.loadSegments.bind(store),
			areSegmentsLoaded: store.areSegmentsLoaded.bind(store),
			storeState,
			actions,
			isEqual
		};
	}

	render() {

		const {
			children
		} = this.props;

		return (
			<StoreContextProvider value={this.state}>
				<>
					{children}
				</>
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
		}: IContext
	): IContext {

		const {
			state: storeState,
			actions,
			isEqual
		} = store;

		if (storeState === prevStoreState
			&& actions === prevActions
		) {
			return null;
		}

		return {
			loadSegments:      store.loadSegments.bind(store),
			areSegmentsLoaded: store.areSegmentsLoaded.bind(store),
			storeState,
			actions,
			isEqual
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
