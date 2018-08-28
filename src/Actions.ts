import { AnyAction } from 'redux';
import {
	protoKeys,
	isFunctionProp
} from './utils/proto';
import Store from './Store';
import { IReducersMap } from './Reducer';

export interface IActionsConstructor {
	namespace: string;
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

	static namespace: string;

	readonly state: TState;

	constructor(
		readonly store: Store
	) {
		runtimePrepareMethods(this);
	}

	get globalState(): TGlobalState {
		return this.store.state;
	}

	get actions(): TAllActions {
		return this.store.actions;
	}
}

export function prepareMethods(
	{
		prototype
	}: IActionsConstructor,
	actionsMap: IReducersMap
) {
	Object.entries(actionsMap).forEach(([type, methodName]) => {
		Reflect.defineProperty(prototype, methodName, {
			value(payload, meta) {

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

				this.store.dispatch(action);
			}
		});
	});
}

function runtimePrepareMethods(actions: Actions) {

	const { namespace } = actions.constructor as IActionsConstructor;
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

		if (selfMethod !== superMethod && superIsFunction) {
			Reflect.defineProperty(actions, methodName, {
				enumerable: true,
				async value(payload, meta) {

					const result = await Reflect.apply(selfMethod, actions, [
						payload,
						meta
					]);

					superMethod(payload, meta);

					return result;
				}
			});
		} else {
			Reflect.defineProperty(actions, methodName, {
				enumerable: true,
				value: selfMethod.bind(actions)
			});
		}

		Reflect.defineProperty(actions[methodName], 'name', {
			value: methodName
		});
	});
}
