import { AnyAction } from 'redux';
import Store, {
	StoreActions,
	StoreNamespacedActions
} from './Store';
import { ReducersMap } from './Reducer';

export interface IActionsConstructor {
	new (
		store: Store,
		actionsMap: ReducersMap,
		namespace?: string
	): Actions;
}

export default class Actions {

	readonly state: any;
	readonly globalState: any;
	readonly actions: StoreActions|StoreNamespacedActions;
	readonly [action: string]: any;

	constructor(
		private store: Store,
		actionsMap: ReducersMap,
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

	private prepareMethods(actionsMap: ReducersMap) {

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

					if (typeof payload != 'undefined') {

						action.payload = payload;

						if (payload instanceof Error) {
							action.error = true;
						}
					}

					if (typeof meta != 'undefined') {
						action.meta = meta;
					}

					store.dispatch(action);
				}
			});
		});

		Reflect.ownKeys(actionsProto).forEach((methodName) => {

			if (typeof methodName == 'symbol') {
				return;
			}

			const method = actionsProto[methodName];

			if (methodName == 'constructor'
				|| typeof method != 'function'
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
