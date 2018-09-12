import {
	Store as ReduxStore,
	Reducer as ReduxReducer,
	StoreEnhancer,
	createStore
} from 'redux';
import {
	Map as ImmutableMap
} from 'immutable';
import {
	IReducerConstructor,
	createReducer
} from './Reducer';
import {
	IActionsConstructor
} from './Actions';

type InputClasses<T> = T | T[] | {
	[key: string]: T;
};

type SegmentLoader = () => Promise<IAddSegmentConfig>;

export interface IStoreConfig<TState> {
	reducer?: InputClasses<IReducerConstructor>;
	actions?: InputClasses<any>;
	state: TState;
	enhancer?: StoreEnhancer;
}

export interface IAddSegmentConfig {
	reducer: InputClasses<IReducerConstructor>;
	actions?: InputClasses<any>;
}

/**
 * Sort classes by having of namespace property.
 * @param  class - Target class.
 * @return Has namespace property or not.
 */
function sortClasses({ namespace }: IReducerConstructor|IActionsConstructor) {
	return namespace ? 1 : 0;
}

/**
 * Convert class, array of classes or object of classes to array of classes.
 * @param  inputClasses - Target to convert.
 * @param  usedClasses - Classes to exclude.
 * @return Array of classes.
 */
function inputClassesToArray<T>(inputClasses, usedClasses: Set<any>): T[] {
	const classesArray = Array.isArray(inputClasses)
		? inputClasses
		: inputClasses && Reflect.getPrototypeOf(inputClasses) === Object.prototype
			? Object.values(inputClasses)
			: [inputClasses];

	return classesArray
		.map((inputClass) => {

			if (usedClasses.has(inputClass)) {
				return null;
			}

			usedClasses.add(inputClass);

			return inputClass;
		})
		.filter(Boolean)
		.sort(sortClasses);
}

/**
 * Empty reducer.
 * @param  state - State.
 * @return State.
 */
function noopReducer(state) {
	return state;
}

export default class Store<
	TState = any,
	TActions = any
> {

	private store: ReduxStore;
	private storeActions: TActions;
	private reducer: ReduxReducer = null;
	private readonly usedClasses = new Set();
	private readonly segmentsRegistry = new Map<any, SegmentLoader>();

	constructor({
		reducer: inputReducers,
		actions: inputActions,
		state: stateBase,
		enhancer
	}: IStoreConfig<TState>) {

		const { usedClasses } = this;
		const reducers = inputClassesToArray<IReducerConstructor>(inputReducers, usedClasses);
		const actions = inputClassesToArray<IActionsConstructor>(inputActions, usedClasses);
		let state: any = stateBase;

		const reducer: ReduxReducer = reducers.reduce<ReduxReducer>((
			parentReducer: ReduxReducer,
			Reducer: IReducerConstructor
		) => {

			const {
				namespace,
				initialState
			} = Reducer;
			const reducer = createReducer(Reducer, parentReducer);

			if (namespace) {

				if (!state) {
					state = ImmutableMap();
				}

				if (initialState
					&& (!state.has(namespace) || state.get(namespace) === null)
				) {
					state = state.set(namespace, initialState);
				}

			} else
			if (!state && initialState) {
				state = initialState;
			}

			return reducer;
		}, null);

		this.store = createStore(reducer || noopReducer, state, enhancer);
		this.storeActions = this.createActions(actions);
		this.reducer = reducer;
	}

	/**
	 * Add reducers and actions on the fly. Initial state will be ignored.
	 * @param  config - Object with reducers adn actions.
	 * @return Store instance.
	 */
	addSegment<TAddActions = any>(config: IAddSegmentConfig): Store<TState, TActions & TAddActions> {

		const { usedClasses } = this;
		const reducers = inputClassesToArray<IReducerConstructor>(config.reducer, usedClasses);
		const actions = inputClassesToArray<IActionsConstructor>(config.actions, usedClasses);

		const reducer: ReduxReducer = reducers.reduce<ReduxReducer>(
			(
				parentReducer: ReduxReducer,
				Reducer: IReducerConstructor
			) => createReducer(Reducer, parentReducer),
			this.reducer
		);

		this.store.replaceReducer(reducer || noopReducer);
		Object.assign(this.storeActions, this.createActions(actions));
		this.reducer = reducer;

		return this as any;
	}

	/**
	 * Add segment loader to the registry.
	 * @param  id - Segment identificator.
	 * @param  segmentLoader - Async segment loader.
	 * @return Store instance.
	 */
	registerSegment(id: any, segmentLoader: SegmentLoader) {

		const { segmentsRegistry } = this;

		if (segmentsRegistry.has(id)) {
			throw new Error('Segment is already registered.');
		}

		segmentsRegistry.set(id, segmentLoader);

		return this;
	}

	/**
	 * Load segment from registry.
	 * @param  id - Segment identificator.
	 * @return Store instance.
	 */
	async loadSegment(id: any) {

		const { segmentsRegistry } = this;
		const segmentLoader = segmentsRegistry.get(id);

		// Already loaded.
		if (segmentLoader === null) {
			return this;
		}

		if (!segmentLoader) {
			throw new Error('Segment is doesn\'t registered.');
		}

		const segmentConfig = await segmentLoader();

		// Mark as loaded.
		segmentsRegistry.set(id, null);

		return this.addSegment(segmentConfig);
	}

	/**
	 * Load segments from registry
	 * @param  ids - Segments identificators.
	 * @return Store instance.
	 */
	async loadSegments(ids: any[]) {
		await Promise.all(ids.map(id => this.loadSegment(id)));
		return this;
	}

	/**
	 * Destroy store instance.
	 */
	destroy() {
		this.store = null;
		this.storeActions = null;
	}

	/**
	 * Create actions object from classes.
	 * @param  actions - Classes.
	 * @return Actions object.
	 */
	private createActions(
		actions: IActionsConstructor[]
	): TActions {
		return actions.reduce<any>((actions, Actions) => {

			const {
				namespace
			} = Actions;
			const actionsIsntance = new Actions(this);

			if (namespace) {
				actions[namespace] = actionsIsntance;
			} else {
				Object.assign(actions, actionsIsntance);
			}

			return actions;
		}, {});
	}

	/**
	 * Throw error if instance was destroyed.
	 */
	private checkIfDestroyed() {

		if (this.store === null) {
			throw new Error('Store was destroyed.');
		}
	}

	/**
	 * State getter.
	 * @return Current state.
	 */
	get state(): TState {
		this.checkIfDestroyed();
		return this.store.getState();
	}

	/**
	 * Dispatch getter.
	 * @return Dispatch function.
	 */
	get dispatch() {
		this.checkIfDestroyed();
		return this.store.dispatch;
	}

	/**
	 * Subscribe getter.
	 * @return Subscribe function.
	 */
	get subscribe() {
		this.checkIfDestroyed();
		return this.store.subscribe;
	}

	/**
	 * Actions getter.
	 * @return Actions object.
	 */
	get actions() {
		this.checkIfDestroyed();
		return this.storeActions;
	}
}
