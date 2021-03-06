import {
	Reducer as ReduxReducer
} from 'redux';
import {
	protoKeys,
	getMethodName
} from './utils/proto';
import {
	IStateAdapter
} from './adapters';
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

	/**
	 * Getter to generate base actions class.
	 * @return Base class with dispatch methods.
	 */
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
			static customDispatchers = new Map();
			static reversedActionsMap = {};
			static namespace = namespace;
		};
		/* tslint:enable:max-classes-per-file */

		prepareMethods(
			GeneratedActions,
			getReducersMap(this)
		);

		return GeneratedActions;
	}
}

/**
 * Decorator to override action type.
 * @param  type - Action type.
 * @return Decorator for class method.
 */
export function ActionType(type: string) {
	return (_, __, descriptor) => {
		Reflect.defineProperty(descriptor.value, 'name', {
			value: type
		});
	};
}

/**
 * Create reducer function from reducer class.
 * @param  Reducer - Reducer class.
 * @param  parentReducer - Parent reducer function.
 * @return Reducer function.
 */
export function createReducer(
	adapter: IStateAdapter,
	Reducer: IReducerConstructor,
	parentReducer?: ReduxReducer
): ReduxReducer {

	const {
		namespace
	} = Reducer;

	if (namespace) {
		return createNamespaceReducer(adapter, Reducer, parentReducer);
	}

	return createSimpleReducer(Reducer, parentReducer);
}

/**
 * Get `{ [action name]: [method name] }` map from reducer class.
 * @param  Reducer - Reducer class.
 * @return `{ [action name]: [method name] }` map.
 */
export function getReducersMap(Reducer: IReducerConstructor) {

	const {
		namespace,
		prototype
	} = Reducer;
	const actionNamespace = typeof namespace === 'string'
		? `${namespace}/`
		: '';
	const reducersNames = protoKeys(prototype);
	const reducersMap = reducersNames.reduce<IReducersMap>((reducersMap, reducerName) => {
		reducersMap[`${actionNamespace}${getMethodName(prototype, reducerName)}`] = reducerName;
		return reducersMap;
	}, {});

	return reducersMap;
}

/**
 * Create reducer function from reducer class without namespaces.
 * @param  Reducer - Reducer class.
 * @param  parentReducer - Parent reducer function.
 * @return Reducer function.
 */
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

/**
 * Create reducer function from reducer class with namespaces.
 * @param  Reducer - Reducer class.
 * @param  parentReducer - Parent reducer function.
 * @return Reducer function.
 */
function createNamespaceReducer(
	adapter: IStateAdapter,
	Reducer: IReducerConstructor,
	parentReducer: ReduxReducer
): ReduxReducer {

	const {
		get,
		set
	} = adapter;
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
				return set(
					state,
					namespace,
					reducer[reducersMap[type]](get(state, namespace), action)
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
			return set(
				state,
				namespace,
				reducer[reducersMap[type]](get(state, namespace), action)
			);
		}

		return state;
	};
}

/**
 * Check target it is reducer class.
 * @param  target - Target to check.
 * @return Result.
 */
export function isReducerClass(target: any): target is IReducerConstructor {
	return target && target.prototype instanceof Reducer;
}
