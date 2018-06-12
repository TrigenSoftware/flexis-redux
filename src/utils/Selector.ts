import {
	IStoreActions,
	IStoreNamespacedActions
} from '../Store';
import defaultMergeProps from './mergeProps';
import initMapFunction, { IMapFunction } from './initMapFunction';
import isEqual from './isEqual';

export type Actions = IStoreActions|IStoreNamespacedActions;

export interface IMapStateToProps extends IMapFunction {
	(
		state: any,
		ownProps: object
	): object;
}

export interface IMapActionsToProps extends IMapFunction {
	(
		actions: Actions,
		ownProps: object
	): object;
}

// Named as interface due to consistenсy.
export type IMergeProps = (
	stateProps: object,
	actionsProps: object,
	ownProps: object
) => object;

export default class Selector {

	error: Error;
	shouldComponentUpdate: boolean;
	props: object;
	private mapStateToProps: IMapStateToProps;
	private mapActionsToProps: IMapActionsToProps;
	private mergeProps: IMergeProps;
	private hasRunAtLeastOnce: boolean;
	private state: object;
	private actions: object;
	private ownProps: object;
	private stateProps: object;
	private actionsProps: object;
	private mergedProps: object;

	constructor(
		mapStateToProps?: IMapStateToProps,
		mapActionsToProps?: IMapActionsToProps,
		mergeProps = defaultMergeProps
	) {
		this.mapStateToProps = initMapFunction<IMapStateToProps>(mapStateToProps);
		this.mapActionsToProps = initMapFunction<IMapActionsToProps>(mapActionsToProps);
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

	destroy() {

		const noop = initMapFunction();

		this.mapStateToProps = noop as IMapStateToProps;
		this.mapActionsToProps = noop as IMapActionsToProps;
		this.mergeProps = noop as IMergeProps;
		this.error = null;
		this.shouldComponentUpdate = false;
		this.props = {};
		this.hasRunAtLeastOnce = false;
		this.state = {};
		this.actions = {};
		this.ownProps = {};
		this.stateProps = {};
		this.actionsProps = {};
		this.mergedProps = {};
	}

	run(state, actions: Actions, ownProps: object) {

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

	private handleFirstCall(
		firstState: any,
		firstActions: Actions,
		firstOwnProps: object
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

	private handleSubsequentCalls(
		nextState: any,
		nextActions: Actions,
		nextOwnProps: object
	) {

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

	private handleNewActions() {

		const {
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

	private handleNewState() {

		const {
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
