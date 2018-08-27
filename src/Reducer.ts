import {
	Reducer as ReduxReducer
} from 'redux';
import {
	protoKeys
} from './utils/proto';
import Actions, {
	prepareMethods
} from './Actions';

export interface IReducerConstructor {
	namespace?: string;
	initialState?: any;
	Actions: typeof Actions;
	new (): Reducer;
}

export interface IReducersMap {
	[actionType: string]: string;
}

export default class Reducer {

	static namespace: string;
	static initialState?: any;
	static get Actions() {

		const {
			namespace
		} = this;
		/* tslint:disable:max-classes-per-file */
		const GeneratedActions = class GeneratedActions<
			TState = any,
			TGlobalState = any,
			TAllActions = any
		> extends Actions<
			TState,
			TGlobalState,
			TAllActions
		> {
			static namespace: string = namespace;
		};
		/* tslint:enable:max-classes-per-file */

		prepareMethods(
			GeneratedActions,
			getReducersMap(this)
		);

		return GeneratedActions;
	}
}

export function ActionType(type) {
	return (_, __, descriptor) => {
		Reflect.defineProperty(descriptor.value, 'name', {
			value: type
		});
	};
}

export function createReducer(
	Reducer: IReducerConstructor,
	parentReducer?: ReduxReducer
): ReduxReducer {

	const {
		namespace
	} = Reducer;

	if (namespace) {
		return createNamespaceReducer(Reducer, parentReducer);
	}

	return createSimpleReducer(Reducer, parentReducer);
}

function getReducersMap(Reducer: IReducerConstructor) {

	const {
		namespace,
		prototype
	} = Reducer;
	const actionNamespace = typeof namespace === 'string'
		? `${namespace}/`
		: '';
	const reducersNames = protoKeys(prototype);
	const reducersMap = reducersNames.reduce<IReducersMap>((reducersMap, reducerName) => {
		reducersMap[`${actionNamespace}${prototype[reducerName].name}`] = reducerName;
		return reducersMap;
	}, {});

	return reducersMap;
}

function createSimpleReducer(
	Reducer: IReducerConstructor,
	parentReducer: ReduxReducer
): ReduxReducer {

	const reducer = new Reducer();
	const reducersMap = getReducersMap(Reducer);
	const withParentReducer = typeof parentReducer === 'function';

	if (withParentReducer) {
		return (inputState, action) => {

			const state = parentReducer(inputState, action);

			if (state !== inputState) {
				return state;
			}

			const {
				type
			} = action;

			if (reducersMap.hasOwnProperty(type)) {
				return reducer[reducersMap[type]](state, action);
			}

			return state;
		};
	}

	return (state, action) => {

		const {
			type
		} = action;

		if (reducersMap.hasOwnProperty(type)) {
			return reducer[reducersMap[type]](state, action);
		}

		return state;
	};
}

function createNamespaceReducer(
	Reducer: IReducerConstructor,
	parentReducer: ReduxReducer
): ReduxReducer {

	const {
		namespace
	} = Reducer;
	const reducer = new Reducer();
	const reducersMap = getReducersMap(Reducer);
	const withParentReducer = typeof parentReducer === 'function';

	if (withParentReducer) {
		return (inputState, action) => {

			const state = parentReducer(inputState, action);

			if (state !== inputState) {
				return state;
			}

			const {
				type
			} = action;

			if (reducersMap.hasOwnProperty(type)) {
				return state.set(
					namespace,
					reducer[reducersMap[type]](state.get(namespace), action)
				);
			}

			return state;
		};
	}

	return (state, action) => {

		const {
			type
		} = action;

		if (reducersMap.hasOwnProperty(type)) {
			return state.set(
				namespace,
				reducer[reducersMap[type]](state.get(namespace), action)
			);
		}

		return state;
	};
}
