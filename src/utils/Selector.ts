import defaultMergeProps from './mergeProps';
import initMapFunction, {
	IMapFunction
} from './initMapFunction';

export {
	IMapFunction
};

export interface IMapStateToProps<
	TStateProps,
	TState,
	TOwnProps = {}
> extends IMapFunction {
	(
		state: TState,
		ownProps?: TOwnProps
	): TStateProps;
}

export interface IMapActionsToProps<
	TActionProps,
	TActions,
	TOwnProps = {}
> extends IMapFunction {
	(
		actions: TActions,
		ownProps?: TOwnProps
	): TActionProps;
}

export interface IMergeProps<
	TMergedProps,
	TStateProps,
	TActionProps,
	TOwnProps
> {
	(
		stateProps: TStateProps,
		actionsProps: TActionProps,
		ownProps: TOwnProps
	): TMergedProps;
}

export default class Selector {

	error: Error;
	shouldComponentUpdate: boolean;
	props: {};
	private mapStateToProps: IMapFunction;
	private mapActionsToProps: IMapFunction;
	private mergeProps: IMapFunction;
	private hasRunAtLeastOnce: boolean;
	private state: any;
	private actions: any;
	private ownProps: {};
	private stateProps: {};
	private actionsProps: {};
	private mergedProps: {};

	constructor(
		private readonly isEqual: (a: any, b: any) => boolean,
		mapStateToProps?: IMapFunction,
		mapActionsToProps?: IMapFunction,
		mergeProps: IMapFunction = defaultMergeProps
	) {
		this.mapStateToProps = initMapFunction(mapStateToProps);
		this.mapActionsToProps = initMapFunction(mapActionsToProps);
		this.mergeProps = mergeProps;
		this.error = null;
		this.shouldComponentUpdate = true;
		this.hasRunAtLeastOnce = false;
		this.props = {};
		this.state = {};
		this.actions = {};
		this.ownProps = {};
		this.stateProps = {};
		this.actionsProps = {};
		this.mergedProps = {};
	}

	/**
	 * Destroy selector instance.
	 */
	destroy() {

		const noop = initMapFunction();

		this.mapStateToProps = noop as IMapFunction;
		this.mapActionsToProps = noop as IMapFunction;
		this.mergeProps = noop as IMapFunction;
		this.error = null;
		this.shouldComponentUpdate = false;
		this.hasRunAtLeastOnce = false;
		this.props = {};
		this.state = {};
		this.actions = {};
		this.ownProps = {};
		this.stateProps = {};
		this.actionsProps = {};
		this.mergedProps = {};
	}

	/**
	 * Run next props calculating.
	 * @param state - Store state.
	 * @param actions - Store actions.
	 * @param ownProps - Component's own props.
	 */
	run(
		state,
		actions,
		ownProps: {}
	) {

		try {

			const nextProps = this.hasRunAtLeastOnce
				? this.handleSubsequentCalls(state, actions, ownProps)
				: this.handleFirstCall(state, actions, ownProps);

			if (nextProps !== this.props || this.error) {
				this.shouldComponentUpdate = true;
				this.props = nextProps;
				this.error = null;
			}

		} catch (error) {
			this.shouldComponentUpdate = true;
			this.error = error;
		}
	}

	/**
	 * Handle first calculating call.
	 * @param firstState - Store state.
	 * @param firstActions - Store actions.
	 * @param firstOwnProps - Component's own props.
	 */
	private handleFirstCall(
		firstState,
		firstActions,
		firstOwnProps: {}
	) {

		const {
			mapStateToProps,
			mapActionsToProps,
			mergeProps
		} = this;

		this.state = firstState;
		this.actions = firstActions;
		this.ownProps = firstOwnProps;
		this.stateProps = mapStateToProps(firstState, firstOwnProps);
		this.actionsProps = mapActionsToProps(firstActions, firstOwnProps);
		this.mergedProps = mergeProps(this.stateProps, this.actionsProps, firstOwnProps);
		this.hasRunAtLeastOnce = true;

		return this.mergedProps;
	}

	/**
	 * Handle subsequent calculating call.
	 * @param nextState - Store state.
	 * @param nextActions - Store actions.
	 * @param nextOwnProps - Component's own props.
	 */
	private handleSubsequentCalls(
		nextState,
		nextActions,
		nextOwnProps: {}
	) {

		const {
			isEqual
		} = this;
		const propsChanged = !isEqual(nextOwnProps, this.ownProps);
		const actionsChanged = !isEqual(nextActions, this.actions);
		const stateChanged = !isEqual(nextState, this.state);

		this.state = nextState;
		this.actions = nextActions;
		this.ownProps = nextOwnProps;

		if (propsChanged && actionsChanged && stateChanged) {
			return this.handleNewPropsAndNewActionsAndNewState();
		}

		if (propsChanged && stateChanged) {
			return this.handleNewPropsAndNewState();
		}

		if (propsChanged && actionsChanged) {
			return this.handleNewPropsAndNewActions();
		}

		if (actionsChanged && stateChanged) {
			return this.handleNewActionsAndNewState();
		}

		if (propsChanged) {
			this.handleNewProps();
		}

		if (actionsChanged) {
			this.handleNewActions();
		}

		if (stateChanged) {
			this.handleNewState();
		}

		return this.mergedProps;
	}

	/**
	 * Handle new props, new actions and new state.
	 * @return Merged props.
	 */
	private handleNewPropsAndNewActionsAndNewState() {

		const {
			mapStateToProps,
			mapActionsToProps,
			mergeProps,
			state,
			actions,
			ownProps
		} = this;

		this.stateProps = mapStateToProps(state, ownProps);
		this.actionsProps = mapActionsToProps(actions, ownProps);
		this.mergedProps = mergeProps(this.stateProps, this.actionsProps, ownProps);

		return this.mergedProps;
	}

	/**
	 * Handle new props and new state.
	 * @return Merged props.
	 */
	private handleNewPropsAndNewState() {

		const {
			mapStateToProps,
			mapActionsToProps,
			mergeProps,
			state,
			actions,
			ownProps
		} = this;

		this.stateProps = mapStateToProps(state, ownProps);

		if (mapActionsToProps.dependsOnOwnProps) {
			this.actionsProps = mapActionsToProps(actions, ownProps);
		}

		this.mergedProps = mergeProps(this.stateProps, this.actionsProps, ownProps);

		return this.mergedProps;
	}

	/**
	 * Handle new props and new actions.
	 * @return Merged props.
	 */
	private handleNewPropsAndNewActions() {

		const {
			mapStateToProps,
			mapActionsToProps,
			mergeProps,
			state,
			actions,
			ownProps
		} = this;

		this.actionsProps = mapActionsToProps(actions, ownProps);

		if (mapStateToProps.dependsOnOwnProps) {
			this.stateProps = mapStateToProps(state, ownProps);
		}

		this.mergedProps = mergeProps(this.stateProps, this.actionsProps, ownProps);

		return this.mergedProps;
	}

	/**
	 * Handle new actions and new state.
	 * @return Merged props.
	 */
	private handleNewActionsAndNewState() {

		const {
			mapStateToProps,
			mapActionsToProps,
			mergeProps,
			state,
			actions,
			ownProps
		} = this;

		this.actionsProps = mapActionsToProps(actions, ownProps);
		this.stateProps = mapStateToProps(state, ownProps);
		this.mergedProps = mergeProps(this.stateProps, this.actionsProps, ownProps);

		return this.mergedProps;
	}

	/**
	 * Handle new props.
	 * @return Merged props.
	 */
	private handleNewProps() {

		const {
			mapStateToProps,
			mapActionsToProps,
			mergeProps,
			state,
			actions,
			ownProps
		} = this;

		if (mapStateToProps.dependsOnOwnProps) {
			this.stateProps = mapStateToProps(state, ownProps);
		}

		if (mapActionsToProps.dependsOnOwnProps) {
			this.actionsProps = mapActionsToProps(actions, ownProps);
		}

		this.mergedProps = mergeProps(this.stateProps, this.actionsProps, ownProps);

		return this.mergedProps;
	}

	/**
	 * Handle new actions.
	 * @return Merged props.
	 */
	private handleNewActions() {

		const {
			isEqual,
			mapActionsToProps,
			mergeProps,
			actions,
			stateProps,
			ownProps
		} = this;

		const nextActionsProps = mapActionsToProps(actions, ownProps);
		const actionsPropsChanged = !isEqual(nextActionsProps, this.actionsProps);

		this.actionsProps = nextActionsProps;

		if (actionsPropsChanged) {
			this.mergedProps = mergeProps(stateProps, this.actionsProps, ownProps);
		}

		return this.mergedProps;
	}

	/**
	 * Handle new state.
	 * @return Merged props.
	 */
	private handleNewState() {

		const {
			isEqual,
			mapStateToProps,
			mergeProps,
			state,
			actionsProps,
			ownProps
		} = this;

		const nextStateProps = mapStateToProps(state, ownProps);
		const statePropsChanged = !isEqual(nextStateProps, this.stateProps);

		this.stateProps = nextStateProps;

		if (statePropsChanged) {
			this.mergedProps = mergeProps(this.stateProps, actionsProps, ownProps);
		}

		return this.mergedProps;
	}
}
