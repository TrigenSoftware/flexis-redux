import {
	ContextType,
	ComponentType,
	ComponentClass,
	Component,
	createElement
} from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import Selector, {
	IMapFunction,
	IMapStateToProps,
	IMapActionsToProps,
	IMergeProps
} from './utils/Selector';
import StoreContext from './StoreContext';

interface IConnectOptions {
	dependsOn?: any|any[];
	skipWaiting?: boolean;
	loading?: ComponentType;
	mapStateToProps: IMapFunction;
	mapActionsToProps?: IMapFunction;
	mergeProps?: IMapFunction;
	withRef?: boolean;
}

type CombineProps<U, T> = U & {
	[K in Exclude<keyof T, keyof U>]?: T[K]
};

type ConnectedComponentClass<TOwnProps, TProps> = ComponentClass<TOwnProps> & {
	WrappedComponent: ComponentType<CombineProps<TProps, TOwnProps>>
};

type ConnectDecorator<TOwnProps, TProps> = (WrappedComponent: ComponentType<CombineProps<TProps, TOwnProps>>) =>
	ConnectedComponentClass<TOwnProps, TProps>
;

enum LoadingStatus {
	Pending,
	InProgress,
	Done
}

let hotReloadingVersion = 0;

export default Connect;

function Connect<
	TStateProps,
	TState,
	TOwnProps = any
>(options: {
	dependsOn?: any|any[];
	skipWaiting?: boolean;
	loading?: ComponentType;
	mapStateToProps: IMapStateToProps<TStateProps, TState, TOwnProps>
}): ConnectDecorator<TOwnProps, TStateProps>;

function Connect<
	TActionsProps,
	TActions,
	TOwnProps = any
>(options: {
	dependsOn?: any|any[];
	skipWaiting?: boolean;
	loading?: ComponentType;
	mapStateToProps: null | undefined,
	mapActionsToProps: IMapActionsToProps<TActionsProps, TActions, TOwnProps>
}): ConnectDecorator<TOwnProps, TActionsProps>;

function Connect<
	TStateProps,
	TActionsProps,
	TState,
	TActions,
	TOwnProps = any
>(options: {
	dependsOn?: any|any[];
	skipWaiting?: boolean;
	loading?: ComponentType;
	mapStateToProps: IMapStateToProps<TStateProps, TState, TOwnProps>,
	mapActionsToProps: IMapActionsToProps<TActionsProps, TActions, TOwnProps>
}): ConnectDecorator<TOwnProps, TStateProps & TActionsProps>;

function Connect<
	TStateProps,
	TActionsProps,
	TMergedProps,
	TState,
	TOwnProps = any
>(options: {
	dependsOn?: any|any[];
	skipWaiting?: boolean;
	loading?: ComponentType;
	mapStateToProps: IMapStateToProps<TStateProps, TState, TOwnProps>,
	mapActionsToProps: null | undefined,
	mergeProps: IMergeProps<TMergedProps, TStateProps, TActionsProps, TOwnProps>,
	withRef?: boolean
}): ConnectDecorator<TOwnProps, TMergedProps>;

function Connect<
	TStateProps,
	TActionsProps,
	TMergedProps,
	TActions,
	TOwnProps = any
>(options: {
	dependsOn?: any|any[];
	skipWaiting?: boolean;
	loading?: ComponentType;
	mapStateToProps: null | undefined,
	mapActionsToProps: IMapActionsToProps<TActionsProps, TActions, TOwnProps>,
	mergeProps: IMergeProps<TMergedProps, TStateProps, TActionsProps, TOwnProps>,
	withRef?: boolean
}): ConnectDecorator<TOwnProps, TMergedProps>;

function Connect<
	TStateProps,
	TActionsProps,
	TMergedProps,
	TState,
	TActions,
	TOwnProps = any
>(options: {
	dependsOn?: any|any[];
	skipWaiting?: boolean;
	loading?: ComponentType;
	mapStateToProps: IMapStateToProps<TStateProps, TState, TOwnProps>,
	mapActionsToProps: IMapActionsToProps<TActionsProps, TActions, TOwnProps>,
	mergeProps: IMergeProps<TMergedProps, TStateProps, TActionsProps, TOwnProps>,
	withRef?: boolean
}): ConnectDecorator<TOwnProps, TMergedProps>;

/**
 * Decorator to connect component to the store.
 * @param  mapStateToProps - Function to map state to props.
 * @param  mapActionsToProps - Function to map actions to props.
 * @param  mergeProps - Function to merge props.
 * @param  options - Connect options.
 * @return Connect HOC.
 */
function Connect({
	dependsOn,
	skipWaiting,
	loading: Loading,
	mapStateToProps,
	mapActionsToProps,
	mergeProps,
	withRef
}: IConnectOptions) {
	return (WrappedComponent) => {

		const depsIds = Array.isArray(dependsOn)
			? dependsOn
			: dependsOn
				? [dependsOn]
				: [];
		const withDeps = Boolean(depsIds.length);
		const wrappedComponentName = WrappedComponent.displayName
			|| WrappedComponent.name
			|| 'Component';
		const displayName = `Connect(${wrappedComponentName})`;

		class Connect extends Component {

			static WrappedComponent = WrappedComponent;
			static displayName = displayName;
			static contextType = StoreContext;

			context!: ContextType<typeof StoreContext>;
			wrappedInstance = null;
			private depsLoadingStatus: LoadingStatus = LoadingStatus.Pending;
			private selector: Selector = null;
			private renderedChild = null;

			constructor(props, context) {

				super(props, context);

				this.onWrappedInstance = this.onWrappedInstance.bind(this);
				this.onSegmentsLoaded = this.onSegmentsLoaded.bind(this);
			}

			render() {

				const {
					loadSegments,
					areSegmentsLoaded,
					storeState,
					actions,
					isEqual
				} = this.context;

				if (this.loadDeps(loadSegments, areSegmentsLoaded)) {
					return this.renderedChild;
				}

				if (this.selector === null) {
					this.initSelector(storeState, actions, isEqual);
				} else {
					this.selector.run(
						storeState,
						actions,
						this.props
					);
				}

				const {
					selector
				} = this;

				if (selector.error) {
					throw selector.error;
				} else
				if (selector.shouldComponentUpdate) {
					selector.shouldComponentUpdate = false;
					this.renderedChild = createElement(
						WrappedComponent,
						this.addExtraProps(selector.props)
					);
				}

				return this.renderedChild;
			}

			componentWillUnmount() {

				if (this.selector !== null) {
					this.selector.destroy();
				}

				this.selector = null;
			}

			private onWrappedInstance(ref) {
				this.wrappedInstance = ref;
			}

			getWrappedInstance() {
				return this.wrappedInstance;
			}

			private initSelector(storeState, actions, isEqual) {

				const selector = new Selector(
					isEqual,
					mapStateToProps,
					mapActionsToProps,
					mergeProps
				);

				this.selector = selector;
				selector.run(
					storeState,
					actions,
					this.props
				);
			}

			// tslint:disable-next-line
			private addExtraProps(props) {
				return props;
			}

			private loadDeps(
				loadSegments: (ids: any[]) => Promise<void>,
				areSegmentsLoaded: (ids: any[]) => boolean
			) {

				const {
					depsLoadingStatus
				} = this;

				if (!withDeps || depsLoadingStatus === LoadingStatus.Done) {
					return false;
				}

				if (depsLoadingStatus === LoadingStatus.Pending) {

					if (areSegmentsLoaded(depsIds)) {
						this.depsLoadingStatus = LoadingStatus.Done;
						return false;
					}

					this.renderedChild = Loading
						? createElement(Loading)
						: null;
					this.depsLoadingStatus = LoadingStatus.InProgress;
					loadSegments(depsIds).then(this.onSegmentsLoaded);
				}

				return !skipWaiting;
			}

			private onSegmentsLoaded() {

				const {
					selector
				} = this;

				if (selector) {
					selector.forceUpdateOnNextRun();
				}

				this.depsLoadingStatus = LoadingStatus.Done;
				this.forceUpdate();
			}
		}

		const {
			prototype: ConnectPrototype
		} = Connect as any;

		if (withRef) {
			ConnectPrototype.addExtraProps =
			function addExtraProps(props) {
				return {
					...props,
					ref: this.onWrappedInstance
				};
			};
		}

		if (process.env.NODE_ENV !== 'production') {

			const {
				renderChild
			} = ConnectPrototype;

			(Connect as any).version = hotReloadingVersion++;

			ConnectPrototype.renderChild =
			function renderChildWithHotReload(context) {

				const {
					version
				} = this.constructor;

				if (typeof this.version !== 'number') {
					this.version = version;
				} else
				if (this.version !== version) {

					this.version = version;

					if (this.selector !== null) {
						this.selector.destroy();
						this.selector = null;
					}
				}

				return Reflect.apply(renderChild, this, [context]);
			};
		}

		return hoistNonReactStatics(Connect, WrappedComponent) as any;
	};
}
