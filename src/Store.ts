import {
	Store as ReduxStore,
	Reducer as ReduxReducer,
	StoreEnhancer,
	createStore
} from 'redux';
import { Map } from 'immutable';
import {
	IReducerConstructor,
	createReducer
} from './Reducer';
import {
	IActionsConstructor
} from './Actions';

type InputClasses<T> = T | T[] | {
	[key: string]: T;
};

export interface IStoreConfig<TState> {
	reducer?: InputClasses<IReducerConstructor>;
	actions?: InputClasses<any>;
	state: TState;
	enhancer?: StoreEnhancer;
}

export interface IAddConfig {
	reducer: InputClasses<IReducerConstructor>;
	actions?: InputClasses<any>;
}

function sortClasses({ namespace }: IReducerConstructor|IActionsConstructor) {
	return namespace ? 1 : 0;
}

function inputClassesToArray<T>(inputClasses): T[] {
	const classesArray = Array.isArray(inputClasses)
		? inputClasses
		: inputClasses && Reflect.getPrototypeOf(inputClasses) === Object.prototype
			? Object.values(inputClasses)
			: [inputClasses];

	return classesArray.filter(Boolean).sort(sortClasses);
}

function noopReducer(state) {
	return state;
}

export default class Store<
	TState = any,
	TActions = any
> {

	private store: ReduxStore;
	private storeActions: TActions;
	private reducer: ReduxReducer = null;

	constructor({
		reducer: inputReducers,
		actions: inputActions,
		state: stateBase,
		enhancer
	}: IStoreConfig<TState>) {

		const reducers = inputClassesToArray<IReducerConstructor>(inputReducers);
		const actions = inputClassesToArray<IActionsConstructor>(inputActions);
		let state: any = stateBase;

		const reducer: ReduxReducer = reducers.reduce<ReduxReducer>((
			parentReducer: ReduxReducer,
			Reducer: IReducerConstructor
		) => {

			const {
				namespace,
				initialState
			} = Reducer;
			const reducer = createReducer(Reducer, parentReducer);

			if (namespace) {

				if (!state) {
					state = Map();
				}

				if (initialState
					&& (!state.has(namespace) || state.get(namespace) === null)
				) {
					state = state.set(namespace, initialState);
				}

			} else
			if (!state && initialState) {
				state = initialState;
			}

			return reducer;
		}, null);

		this.store = createStore(reducer || noopReducer, state, enhancer);
		this.storeActions = this.createActions(actions);
		this.reducer = reducer;
	}

	add(config: IAddConfig) {

		const reducers = inputClassesToArray<IReducerConstructor>(config.reducer);
		const actions = inputClassesToArray<IActionsConstructor>(config.actions);

		const reducer: ReduxReducer = reducers.reduce<ReduxReducer>(
			(
				parentReducer: ReduxReducer,
				Reducer: IReducerConstructor
			) => createReducer(Reducer, parentReducer),
			this.reducer
		);

		this.store.replaceReducer(reducer || noopReducer);
		Object.assign(this.storeActions, this.createActions(actions));
		this.reducer = reducer;
	}

	destroy() {
		this.store = null;
	}

	private createActions(
		actions: IActionsConstructor[]
	): TActions {
		return actions.reduce<any>((actions, Actions) => {

			const {
				namespace
			} = Actions;
			const actionsIsntance = new Actions(this);

			if (namespace) {
				actions[namespace] = actionsIsntance;
			} else {
				Object.assign(actions, actionsIsntance);
			}

			return actions;
		}, {});
	}

	private checkIfDestroyed() {

		if (this.store === null) {
			throw new Error('Store was destroyed.');
		}
	}

	get state(): TState {
		this.checkIfDestroyed();
		return this.store.getState();
	}

	get dispatch() {
		this.checkIfDestroyed();
		return this.store.dispatch;
	}

	get subscribe() {
		this.checkIfDestroyed();
		return this.store.subscribe;
	}

	get actions() {
		return this.storeActions;
	}
}
