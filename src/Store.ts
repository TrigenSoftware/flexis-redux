import {
	Store as ReduxStore,
	Reducer as ReduxReducer,
	StoreEnhancer,
	createStore
} from 'redux';
import {
	Map,
	fromJS
} from 'immutable';
import Reducer, {
	IReducerConstructor
} from './Reducer';
import Actions, {
	IActionsConstructor
} from './Actions';

interface IStoreNamespacedReducerConstructors {
	[namespace: string]: IReducerConstructor;
}

interface IStoreNamespacedActionsConstructors {
	[namespace: string]: IActionsConstructor;
}

export interface IStoreActions {
	[action: string]: any;
}

export interface IStoreNamespacedActions {
	[namespace: string]: IStoreActions;
}

export interface IStoreConfig {
	reducer: IReducerConstructor|IStoreNamespacedReducerConstructors;
	actions?: IActionsConstructor|IStoreNamespacedActionsConstructors;
	forceState?: any;
	enhancer?: StoreEnhancer;
}

export default class Store {

	private store: ReduxStore;
	private storeActions: IStoreActions|IStoreNamespacedActions;

	constructor({
		reducer,
		actions,
		forceState,
		enhancer
	}: IStoreConfig) {

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
				reducer as IStoreNamespacedReducerConstructors,
				actions as IStoreNamespacedActionsConstructors,
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

		const ActionsConstructor = typeof maybeActions === 'undefined'
			? Actions
			: maybeActions;
		const reducerInstance = new Reducer();
		const reducer = reducerInstance.createReducer();
		const actions = new ActionsConstructor(this, reducerInstance.reducersMap);
		const { initialState } = Reducer;

		let state: any = Map<any, any>();

		if (typeof forceState !== 'undefined') {
			state = fromJS(forceState);
		} else
		if (typeof initialState !== 'undefined') {
			state = fromJS(initialState);
		}

		this.store = createStore(reducer, state, enhancer);
		this.storeActions = actions;
	}

	private createNamespacedStore(
		reducersClasses: IStoreNamespacedReducerConstructors,
		actionsClasses: IStoreNamespacedActionsConstructors,
		forceState,
		enhancer: StoreEnhancer
	) {

		const withoutForceState = typeof forceState === 'undefined';
		const actions: IStoreNamespacedActions = {};

		let reducer: ReduxReducer = null;
		let state = withoutForceState
			? Map<any, any>()
			: fromJS(forceState);

		Object.entries(reducersClasses).forEach(([
			key,
			Reducer
		]: [string, IReducerConstructor]) => {

			const storeKey = key.replace(/^./, key[0].toLowerCase());
			const ActionsConstructor = typeof actionsClasses === 'undefined'
				? Actions
				: actionsClasses[key] || Actions;
			const reducerInstance = new Reducer(storeKey);
			const { initialState } = Reducer;

			reducer = reducerInstance.createReducer(reducer);

			Reflect.defineProperty(actions, storeKey, {
				value: new ActionsConstructor(
					this,
					reducerInstance.reducersMap,
					storeKey
				)
			});

			if (withoutForceState && typeof initialState !== 'undefined') {
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
