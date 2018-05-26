import { createStore } from 'redux';
import {
	Map,
	fromJS
} from 'immutable';
import Reducer from './Reducer';
import Actions from './Actions';

export default class Store {

	constructor(
		reducersClasses,
		actionsClasses,
		forceStateOrEnhancer,
		enhancerOrNoop
	) {

		const withoutForceState = typeof forceStateOrEnhancer == 'function',
			withoutNamespaces = Reflect.getPrototypeOf(reducersClasses) === Reducer;

		const forceState = withoutForceState
			? null
			: forceStateOrEnhancer;

		const enhancer = withoutForceState
			? forceStateOrEnhancer
			: enhancerOrNoop;

		let reducer = null,
			actions = {},
			state = {};

		if (withoutNamespaces) {

			const Reducer = reducersClasses,
				ActionsConstructor = typeof actionsClasses == 'undefined'
					? Actions
					: actionsClasses,
				{ initialState } = Reducer;

			const reducerInstance = new Reducer();

			reducer = reducerInstance.createReducer();
			actions = new ActionsConstructor(this, reducerInstance.reducersMap);

			if (typeof initialState != 'undefined') {
				state = fromJS(initialState);
			}

		} else {
			Object.entries(reducersClasses).forEach(([key, Reducer]) => {

				const storeKey = key.replace(/^./, key[0].toLowerCase()),
					ActionsConstructor = typeof actionsClasses == 'undefined'
						? Actions
						: actionsClasses[key] || Actions,
					{ initialState } = Reducer;

				const reducerInstance = new Reducer(storeKey);

				reducer = reducerInstance.createReducer(reducer);

				Reflect.defineProperty(actions, storeKey, {
					value: new ActionsConstructor(
						this,
						reducerInstance.reducersMap,
						storeKey
					)
				});

				if (typeof initialState != 'undefined') {
					state[storeKey] = fromJS(initialState);
				}
			});
		}

		state = forceState
			? fromJS(forceState)
			: (withoutNamespaces
				? state
				: Map(state));

		this._store = createStore(reducer, state, enhancer);
		this._actions = actions;
	}

	destroy() {
		this._store = null;
	}

	_checkIfDestroyed() {

		if (this._store === null) {
			throw new Error('Store was destroyed.');
		}
	}

	get state() {
		this._checkIfDestroyed();
		return this._store.getState();
	}

	get dispatch() {
		this._checkIfDestroyed();
		return this._store.dispatch;
	}

	get subscribe() {
		this._checkIfDestroyed();
		return this._store.subscribe;
	}

	get actions() {
		return this._actions;
	}
}
