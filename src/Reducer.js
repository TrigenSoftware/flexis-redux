
let ownMethods = [];

export default class Reducer {

	constructor(namespace) {

		const actionNamespace = typeof namespace == 'string'
			? `${namespace}/`
			: '';

		const reducersNames = Reflect.ownKeys(this.constructor.prototype)
			.filter(_ => !ownMethods.includes(_) && typeof _ != 'symbol');

		const reducersMap = reducersNames.reduce((reducersMap, reducerName) => {
			reducersMap[`${actionNamespace}${this[reducerName].name}`] = reducerName;
			return reducersMap;
		}, {});

		this.reducersMap = reducersMap;
		this._namespace = namespace;
	}

	createReducer(parentReducer) {

		const {
			_namespace: namespace
		} = this;

		if (namespace) {
			return this._createNamespaceReducer(parentReducer);
		}

		return this._createReducer(parentReducer);
	}

	_createReducer(parentReducer) {

		const {
			reducersMap
		} = this;

		const withParentReducer = typeof parentReducer == 'function';

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
					return this[reducersMap[type]](state, action);
				}

				return state;
			};
		}

		return (state, action) => {

			const {
				type
			} = action;

			if (reducersMap.hasOwnProperty(type)) {
				return this[reducersMap[type]](state, action);
			}

			return state;
		};
	}

	_createNamespaceReducer(parentReducer) {

		const {
			_namespace: namespace,
			reducersMap
		} = this;

		const withParentReducer = typeof parentReducer == 'function';

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
						this[reducersMap[type]](state.get(namespace), action)
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
					this[reducersMap[type]](state.get(namespace), action)
				);
			}

			return state;
		};
	}
}

ownMethods = Reflect.ownKeys(Reducer.prototype);

export function ActionType(type) {
	return (target, key, descriptor) => {
		Reflect.defineProperty(descriptor.value, 'name', {
			value: type
		});
	};
}
