import {
	Store as ReduxStore,
	Reducer as ReduxReducer,
	StoreEnhancer,
	createStore
} from 'redux';
import {
	Collection,
	Map,
	fromJS
} from 'immutable';
import Reducer, {
	IReducerConstructor
} from './Reducer';
import Actions, {
	IActionsConstructor
} from './Actions';

type StoreNamespacedReducerConstructors = { [namespace: string]: IReducerConstructor };
type StoreNamespacedActionsConstructors = { [namespace: string]: IActionsConstructor };

export type StoreActions = { [action: string]: any };
export type StoreNamespacedActions = { [namespace: string]: StoreActions };

export type StoreConfig = {
	reducer: IReducerConstructor|StoreNamespacedReducerConstructors;
	actions?: IActionsConstructor|StoreNamespacedActionsConstructors;
	forceState?: any;
	enhancer?: StoreEnhancer;
};

export default class Store {

	private store: ReduxStore;
	private storeActions: StoreActions|StoreNamespacedActions;

	constructor({
		reducer,
		actions,
		forceState,
		enhancer
	}: StoreConfig) {

		const withoutNamespaces = Reflect.getPrototypeOf(reducer) === Reducer;

		if (withoutNamespaces) {
			this.createSimpleStore(
				reducer as IReducerConstructor,
				actions as IActionsConstructor,
				forceState,
				enhancer
			);
		} else {
			this.createNamespacedStore(
				reducer as StoreNamespacedReducerConstructors,
				actions as StoreNamespacedActionsConstructors,
				forceState,
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
		forceState,
		enhancer: StoreEnhancer
	) {

		const ActionsConstructor = typeof maybeActions == 'undefined'
				? Actions
				: maybeActions,
			reducerInstance = new Reducer(),
			reducer = reducerInstance.createReducer(),
			actions = new ActionsConstructor(this, reducerInstance.reducersMap),
			{ initialState } = Reducer;

		let state: any = Map<any, any>();

		if (typeof forceState != 'undefined') {
			state = fromJS(forceState);
		} else
		if (typeof initialState != 'undefined') {
			state = fromJS(initialState);
		}

		this.store = createStore(reducer, state, enhancer);
		this.storeActions = actions;
	}

	private createNamespacedStore(
		reducersClasses: StoreNamespacedReducerConstructors,
		actionsClasses: StoreNamespacedActionsConstructors,
		forceState,
		enhancer: StoreEnhancer
	) {

		const withoutForceState = typeof forceState == 'undefined',
			actions: StoreNamespacedActions = {};

		let reducer: ReduxReducer = null,
			state = withoutForceState
				? Map<any, any>()
				: fromJS(forceState);

		Object.entries(reducersClasses).forEach(([
			key,
			Reducer
		]: [string, IReducerConstructor]) => {

			const storeKey = key.replace(/^./, key[0].toLowerCase()),
				ActionsConstructor = typeof actionsClasses == 'undefined'
					? Actions
					: actionsClasses[key] || Actions,
				reducerInstance = new Reducer(storeKey),
				{ initialState } = Reducer;

			reducer = reducerInstance.createReducer(reducer);

			Reflect.defineProperty(actions, storeKey, {
				value: new ActionsConstructor(
					this,
					reducerInstance.reducersMap,
					storeKey
				)
			});

			if (withoutForceState && typeof initialState != 'undefined') {
				state = state.set(storeKey, fromJS(initialState));
			}
		});

		this.store = createStore(reducer, state, enhancer);
		this.storeActions = actions;
	}

	private checkIfDestroyed() {

		if (this.store === null) {
			throw new Error('Store was destroyed.');
		}
	}

	get state(): any {
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
