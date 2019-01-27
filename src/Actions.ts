import { AnyAction } from 'redux';
import {
	protoKeys,
	isFunctionProp
} from './utils/proto';
import Store from './Store';
import { IReducersMap } from './Reducer';

export type ICustomDispatcher = (store: Store, action: AnyAction) => void;

export type ICustomDispatchersMap = Map<() => void, ICustomDispatcher>;

export interface IActionsConstructor {
	customDispatchers: ICustomDispatchersMap;
	reversedActionsMap: IReducersMap;
	namespace?: string;
	new (store: Store): Actions;
}

const EXCLUDE_PROPS = [
	'state',
	'globalState',
	'actions'
];

export default abstract class Actions<
	TState = any,
	TGlobalState = any,
	TAllActions = any
> {

	static customDispatchers: ICustomDispatchersMap;
	static reversedActionsMap: IReducersMap;
	static namespace?: string;

	readonly state: TState;

	constructor(
		readonly store: Store
	) {
		runtimePrepareMethods(this);
	}

	/**
	 * Global state getter.
	 * @return Global state.
	 */
	get globalState(): TGlobalState {
		return this.store.state;
	}

	/**
	 * Actions getter.
	 * @return Actions object.
	 */
	get actions(): TAllActions {
		return this.store.actions;
	}
}

/**
 * Decorator to set custom dispatcher.
 * @param  dispatcher - Custom dispatcher.
 * @return Decorator for class method.
 */
export function CustomDispatcher(dispatcher: ICustomDispatcher) {
	return (target, key, descriptor) => {

		const {
			customDispatchers,
			reversedActionsMap
		} = target.constructor as IActionsConstructor;
		const {
			value: method
		} = descriptor;

		if (reversedActionsMap.hasOwnProperty(key)) {
			customDispatchers.set(method, dispatcher);
		} else {
			throw Error(`Method '${key}' is not dispatcher.`);
		}
	};
}

/**
 * Helper to create action object.
 * @param  type - Action type.
 * @param  payload - Payload.
 * @param  meta - Meta data.
 * @return Action object.
 */
export function createAction(
	type: string,
	payload?: any,
	meta?: any
) {

	const action: AnyAction = {
		type
	};

	if (typeof payload !== 'undefined') {

		action.payload = payload;

		if (payload instanceof Error) {
			action.error = true;
		}
	}

	if (typeof meta !== 'undefined') {
		action.meta = meta;
	}

	return action;
}

/**
 * Define dispatch methods on actios class prototype.
 * @param Actions - Actions class.
 * @param actionsMap - `{ [action name]: [method name] }` map.
 */
export function prepareMethods(
	{
		reversedActionsMap,
		prototype
	}: IActionsConstructor,
	actionsMap: IReducersMap
) {
	Object.entries(actionsMap).forEach(([type, methodName]) => {

		reversedActionsMap[methodName] = type;

		Reflect.defineProperty(prototype, methodName, {
			value(payload, meta) {

				const action = createAction(type, payload, meta);

				this.store.dispatch(action);
			}
		});
	});
}

/**
 * Prepare class methods: define state getter, bind context, wrap payload modifiers.
 * @param actions - Actions instance.
 */
function runtimePrepareMethods(actions: Actions) {

	const {
		reversedActionsMap,
		customDispatchers,
		namespace
	} = actions.constructor as IActionsConstructor;
	const selfProto = Object.getPrototypeOf(actions);
	const superProto = Object.getPrototypeOf(selfProto);
	const methods = protoKeys(selfProto, EXCLUDE_PROPS);

	Reflect.defineProperty(actions, 'state', {
		get: namespace
			? function state() {
				return this.store.state.get(namespace);
			}
			: function state() {
				return this.store.state;
			}
	});

	methods.forEach((methodName) => {

		if (!isFunctionProp(selfProto, methodName)) {
			return;
		}

		const selfMethod = selfProto[methodName];
		const superMethod = superProto[methodName];
		const superIsFunction = typeof superMethod === 'function';
		const selfIsSuper = selfMethod === superMethod;
		let callDispatcher = superMethod;
		let isCustomDispatcher = false;

		if (reversedActionsMap.hasOwnProperty(methodName)
			&& customDispatchers.has(selfMethod)
		) {

			const type = reversedActionsMap[methodName];
			const customDispatcher = customDispatchers.get(selfMethod);

			isCustomDispatcher = true;
			callDispatcher = (payload, meta) => {

				const action = createAction(type, payload, meta);

				customDispatcher(actions.store, action);
			};
		}

		if (superIsFunction && !selfIsSuper) {

			if (!isCustomDispatcher) {
				callDispatcher = callDispatcher.bind(actions);
			}

			Reflect.defineProperty(actions, methodName, {
				enumerable: true,
				value(payload, meta) {

					const result = Reflect.apply(selfMethod, actions, [
						payload,
						meta
					]);

					if (result instanceof Promise) {
						return result.then((result) => {
							callDispatcher(payload, meta);
							return result;
						});
					}

					callDispatcher(payload, meta);

					return result;
				}
			});
		} else {
			Reflect.defineProperty(actions, methodName, {
				enumerable: true,
				value: isCustomDispatcher
					? callDispatcher
					: selfMethod.bind(actions)
			});
		}

		Reflect.defineProperty(actions[methodName], 'name', {
			value: methodName
		});
	});
}
