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
	reducer: InputClasses<IReducerConstructor>;
	actions?: InputClasses<any>;
	state: TState;
	enhancer?: StoreEnhancer;
}

function inputClassesToArray<T>(inputClasses): T[] {
	return inputClasses
		? (Array.isArray(inputClasses)
			? inputClasses
			: Object.values(inputClasses))
		: [];
}

export default class Store<
	TState = any,
	TActions = any
> {

	private store: ReduxStore;
	private storeActions: TActions;

	constructor({
		reducer,
		actions,
		state,
		enhancer
	}: IStoreConfig<TState>) {

		const withoutNamespaces = !Array.isArray(reducer)
			&& Object.prototype !== Reflect.getPrototypeOf(reducer);

		if (withoutNamespaces) {
			this.createSimpleStore(
				reducer as IReducerConstructor,
				actions as IActionsConstructor,
				state,
				enhancer
			);
		} else {
			this.createNamespacedStore(
				inputClassesToArray<IReducerConstructor>(reducer),
				inputClassesToArray<IActionsConstructor>(actions),
				state,
				enhancer
			);
		}
	}

	destroy() {
		this.store = null;
	}

	private createSimpleStore(
		Reducer: IReducerConstructor,
		maybeActions: IActionsConstructor,
		stateBase,
		enhancer: StoreEnhancer
	) {

		const Actions = typeof maybeActions === 'undefined'
			? Reducer.Actions as IActionsConstructor
			: maybeActions;
		const reducer = createReducer(Reducer);
		const actions = new Actions(this);
		const { initialState } = Reducer;

		let state: any = Map();

		if (typeof stateBase !== 'undefined') {
			state = stateBase;
		} else
		if (typeof initialState !== 'undefined') {
			state = initialState;
		}

		this.store = createStore(reducer, state, enhancer);
		this.storeActions = actions as any;
	}

	private createNamespacedStore(
		reducers: IReducerConstructor[],
		maybeActions: IActionsConstructor[],
		stateBase,
		enhancer: StoreEnhancer
	) {

		let state = stateBase || Map();
		let actions: any = {};

		const reducer: ReduxReducer = reducers.reduce<ReduxReducer>((
			parentReducer: ReduxReducer,
			Reducer: IReducerConstructor
		) => {

			const {
				namespace,
				initialState
			} = Reducer;
			const reducer = createReducer(Reducer, parentReducer);

			if (initialState && state.get(namespace) === null) {
				state = state.set(namespace, initialState);
			}

			return reducer;
		}, null);

		if (maybeActions) {
			actions = maybeActions.reduce((actions, Actions) => {
				actions[Actions.namespace] = new Actions(this);
				return actions;
			}, {});
		} else {
			actions = reducers.reduce((actions, { Actions }) => {
				actions[Actions.namespace] = new (Actions as IActionsConstructor)(this);
				return actions;
			}, {});
		}

		this.store = createStore(reducer, state, enhancer);
		this.storeActions = actions;
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
