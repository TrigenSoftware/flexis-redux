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
type OnSegmentLoaded<TState, TActions> = (store: Store<TState, TActions>) => void|Promise<void>;

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

export interface IRegistryItem {
	loader: SegmentLoader;
	onLoaded?: OnSegmentLoaded<any, any>;
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
// todo: null -> Symbol, sync check fn
export default class Store<
	TState = any,
	TActions = any
> {

	private store: ReduxStore;
	private storeActions: TActions;
	private reducer: ReduxReducer = null;
	private readonly usedClasses = new Set();
	private readonly segmentsRegistry = new Map<any, IRegistryItem>();

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
	 * @param  loader - Async segment loader.
	 * @param  onLoaded - Will call after segment adding.
	 * @return Store instance.
	 */
	registerSegment<TAddActions = any>(
		id: any,
		loader: SegmentLoader,
		onLoaded?: OnSegmentLoaded<TState, TActions & TAddActions>
	) {

		const { segmentsRegistry } = this;

		if (segmentsRegistry.has(id)) {
			throw new Error('Segment is already registered.');
		}

		segmentsRegistry.set(id, {
			loader,
			onLoaded
		});

		return this;
	}

	/**
	 * Load segment from registry.
	 * @param  id - Segment identificator.
	 * @return Store instance.
	 */
	async loadSegment(id: any) {

		const { segmentsRegistry } = this;
		const registryItem = segmentsRegistry.get(id);

		// Already loaded.
		if (registryItem === null) {
			return this;
		}

		if (!registryItem) {
			throw new Error('Segment is doesn\'t registered.');
		}

		// Mark as loaded.
		segmentsRegistry.set(id, null);

		const {
			loader,
			onLoaded
		} = registryItem;
		const segmentConfig = await loader();
		const store = this.addSegment(segmentConfig);

		if (typeof onLoaded === 'function') {
			await onLoaded(store);
		}

		return store;
	}

	/**
	 * Load segments from registry
	 * @param  ids - Segments identificators.
	 * @return Store instance.
	 */
	async loadSegments(ids: any[]) {
		await Promise.all(
			ids.map(id => this.loadSegment(id))
		);
		return this;
	}

	/**
	 * Load all segments from registry.
	 * @return Store instance.
	 */
	loadAllSegments() {

		const {
			segmentsRegistry
		} = this;

		return this.loadSegments(
			Array.from(segmentsRegistry.keys())
		);
	}

	/**
	 * Are given segments loaded.
	 * @param  ids - Segments identificators.
	 * @return Result of checking.
	 */
	areSegmentsLoaded(ids: any[]) {

		const {
			segmentsRegistry
		} = this;

		return ids.every(id => segmentsRegistry.get(id) === null);
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
