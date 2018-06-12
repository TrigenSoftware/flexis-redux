import React, {
	ComponentClass,
	StatelessComponent,
	Component,
	createElement
} from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import Selector, {
	IMapStateToProps,
	IMapActionsToProps,
	IMergeProps,
	Actions
} from './utils/Selector';
import StoreContext from './StoreContext';

interface IContext {
	storeState: any;
	actions: Actions;
}

const {
	Consumer: StoreContextConsumer
} = StoreContext;

let hotReloadingVersion = 0;

export default function Connect(
	mapStateToProps?: IMapStateToProps,
	mapActionsToProps?: IMapActionsToProps,
	mergeProps?: IMergeProps,
	{
		withRef
	} = {
		withRef: false
	}
) {
	return (WrappedComponent: ComponentClass|StatelessComponent) => {

		const wrappedComponentName = WrappedComponent.displayName
			|| WrappedComponent.name
			|| 'Component';

		const displayName = `Connect(${wrappedComponentName})`;

		class Connect extends Component {

			static WrappedComponent = WrappedComponent;
			static displayName = displayName;

			wrappedInstance = null;
			private selector: Selector = null;
			private renderedChild = null;

			constructor(props) {
				super(props);
				this.renderChild = this.renderChild.bind(this);
				this.onWrappedInstance = this.onWrappedInstance.bind(this);
			}

			render() {
				return (
					<StoreContextConsumer>
						{this.renderChild}
					</StoreContextConsumer>
				);
			}

			private renderChild({
				storeState,
				actions
			}: IContext) {

				if (this.selector === null) {
					this.initSelector(storeState, actions);
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

			private initSelector(storeState: any, actions: Actions) {

				const selector = new Selector(
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
			private addExtraProps(props: object): object {
				return props;
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

		return hoistNonReactStatics(Connect, WrappedComponent);
	};
}
