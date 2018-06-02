import {
	Reducer as ReduxReducer
} from 'redux';
import { Map } from 'immutable';

export interface IReducerConstructor {
	initialState?: any;
	new (namespace?: string): Reducer;
}

export type ReducersMap = {
	[actionType: string]: string;
};

let ownMethods: PropertyKey[] = [];

export default class Reducer {

	static initialState?: any;
	reducersMap: ReducersMap;

	constructor(
		private namespace?: string
	) {

		const actionNamespace = typeof namespace == 'string'
			? `${namespace}/`
			: '';

		const reducersNames = Reflect.ownKeys(this.constructor.prototype)
			.filter(_ => !ownMethods.includes(_) && typeof _ != 'symbol');

		const reducersMap: ReducersMap = reducersNames.reduce((reducersMap, reducerName) => {
			reducersMap[`${actionNamespace}${this[reducerName].name}`] = reducerName;
			return reducersMap;
		}, {});

		this.reducersMap = reducersMap;
	}

	createReducer(parentReducer?: ReduxReducer): ReduxReducer {

		const {
			namespace
		} = this;

		if (namespace) {
			return this.createNamespaceReducer(parentReducer);
		}

		return this.createSimpleReducer(parentReducer);
	}

	private createSimpleReducer(parentReducer: ReduxReducer): ReduxReducer {

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

	private createNamespaceReducer(parentReducer: ReduxReducer): ReduxReducer {

		const {
			namespace,
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
