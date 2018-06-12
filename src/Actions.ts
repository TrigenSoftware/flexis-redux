import { AnyAction } from 'redux';
import Store, {
	IStoreActions,
	IStoreNamespacedActions
} from './Store';
import { IReducersMap } from './Reducer';

export interface IActionsConstructor {
	new (
		store: Store,
		actionsMap: IReducersMap,
		namespace?: string
	): Actions;
}

export default class Actions {

	readonly state: any;
	readonly globalState: any;
	readonly actions: IStoreActions|IStoreNamespacedActions;
	readonly [action: string]: any;

	constructor(
		private readonly store: Store,
		actionsMap: IReducersMap,
		namespace?: string
	) {
		this.defineStateGetters(namespace);
		this.prepareMethods(actionsMap);
	}

	private defineStateGetters(namespace: string) {

		const {
			store
		} = this;

		Reflect.defineProperty(this, 'state', {
			get: namespace
				? () => store.state.get(namespace)
				: () => store.state
		});

		Reflect.defineProperty(this, 'globalState', {
			get: () => store.state
		});

		Reflect.defineProperty(this, 'actions', {
			get: () => store.actions
		});
	}

	private prepareMethods(actionsMap: IReducersMap) {

		const {
			store
		} = this;
		const {
			prototype: actionsProto
		} = this.constructor;

		Object.entries(actionsMap).forEach(([type, methodName]) => {
			Reflect.defineProperty(this, methodName, {
				value: (payload, meta) => {

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

					store.dispatch(action);
				}
			});
		});

		Reflect.ownKeys(actionsProto).forEach((methodName) => {

			if (typeof methodName === 'symbol') {
				return;
			}

			const method = actionsProto[methodName];

			if (methodName === 'constructor'
				|| typeof method !== 'function'
			) {
				return;
			}

			if (this.hasOwnProperty(methodName)) {

				const dispatch = this[methodName];

				Reflect.defineProperty(this, methodName, {
					value: async (payload, meta) => {

						const result = await Reflect.apply(method, this, [
							payload,
							meta
						]);

						dispatch(payload, meta);

						return result;
					}
				});
			} else {
				Reflect.defineProperty(this, methodName, {
					value: (payload, meta) =>
						Reflect.apply(method, this, [
							payload,
							meta
						])
				});
			}

			Reflect.defineProperty(this[methodName], 'name', {
				value: methodName
			});
		});
	}
}
