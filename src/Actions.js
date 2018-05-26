
export default class Actions {

	constructor(store, actionsMap, namespace) {

		this._store = store;

		this._defineStateGetters(namespace);
		this._prepareMethods(actionsMap);
	}

	_defineStateGetters(namespace) {

		const {
			_store: store
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

	_prepareMethods(actionsMap) {

		const {
			_store: store
		} = this;

		const {
			prototype: actionsProto
		} = this.constructor;

		Object.entries(actionsMap).forEach(([type, methodName]) => {
			Reflect.defineProperty(this, methodName, {
				value: (payload, meta) => {

					const action = {
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
