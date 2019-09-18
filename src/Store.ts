import {
	Store as ReduxStore,
	Reducer as ReduxReducer,
	StoreCreator,
	StoreEnhancer,
	createStore
} from 'redux';
import {
	IStateAdapter
} from './adapters';
import {
	inputClassesToArray,
	composeReducers,
	noopReducer
} from './utils/store';
import {
	IReducerConstructor,
	createReducer,
	isReducerClass
} from './Reducer';
import {
	IActionsConstructor
} from './Actions';

type InputReducer = ReduxReducer | IReducerConstructor;

type InputClasses<T> = T | T[] | {
	[key: string]: T;
};

type SegmentLoader = () => Promise<IAddSegmentConfig>;
type OnSegmentLoaded<TState, TActions> = (store: Store<TState, TActions>) => void|Promise<void>;

export interface IStoreConfig<TState> {
	storeCreator?: StoreCreator;
	adapter: IStateAdapter;
	reducer?: InputClasses<InputReducer>;
	actions?: InputClasses<any>;
	state: TState;
	enhancer?: StoreEnhancer;
}

export interface IAddSegmentConfig {
	reducer: InputClasses<InputReducer>;
	actions?: InputClasses<any>;
}

export interface IRegistryItem {
	loader: SegmentLoader;
	onLoaded?: OnSegmentLoaded<any, any>;
}

// todo: null -> Symbol, sync check fn
export default class Store<
	TState = any,
	TActions = any
> {

	private store: ReduxStore;
	private storeActions: TActions;
	private reducer: ReduxReducer = null;
	private adapter: IStateAdapter = null;
	private readonly usedClasses = new Set();
	private readonly segmentsRegistry = new Map<any, IRegistryItem>();

	constructor({
		storeCreator: customCreateStore = createStore,
		adapter,
		reducer: inputReducers,
		actions: inputActions,
		state: stateBase,
		enhancer
	}: IStoreConfig<TState>) {

		const { usedClasses } = this;
		const reducers = inputClassesToArray<InputReducer>(inputReducers, usedClasses);
		const actions = inputClassesToArray<IActionsConstructor>(inputActions, usedClasses);
		let state: any = stateBase;

		const reducer: ReduxReducer = reducers.reduce<ReduxReducer>((
			parentReducer: ReduxReducer,
			Reducer: InputReducer
		) => {

			if (!isReducerClass(Reducer)) {
				return composeReducers(Reducer, parentReducer);
			}

			const {
				namespace,
				initialState
			} = Reducer;
			const reducer = createReducer(adapter, Reducer, parentReducer);

			if (namespace) {

				if (!state) {
					state = adapter.getDefaultState();
				}

				if (initialState && !adapter.has(state, namespace)) {
					state = adapter.set(state, namespace, initialState);
				}

			} else
			if (!state && initialState) {
				state = initialState;
			}

			return reducer;
		}, null);

		this.store = customCreateStore(
			adapter.wrapReducer(reducer || noopReducer),
			state,
			enhancer
		);
		this.storeActions = this.createActions(actions);
		this.reducer = reducer;
		this.adapter = adapter;
	}

	/**
	 * Add reducers and actions on the fly. Initial state will be ignored.
	 * @param  config - Object with reducers adn actions.
	 * @return Store instance.
	 */
	addSegment<TAddActions = any>(config: IAddSegmentConfig): Store<TState, TActions & TAddActions> {

		const {
			usedClasses,
			adapter
		} = this;
		const reducers = inputClassesToArray<InputReducer>(config.reducer, usedClasses);
		const actions = inputClassesToArray<IActionsConstructor>(config.actions, usedClasses);

		const reducer: ReduxReducer = reducers.reduce<ReduxReducer>(
			(
				parentReducer: ReduxReducer,
				Reducer: InputReducer
			) => isReducerClass(Reducer)
				? createReducer(adapter, Reducer, parentReducer)
				: composeReducers(Reducer, parentReducer),
			this.reducer
		);

		this.store.replaceReducer(
			adapter.wrapReducer(reducer || noopReducer)
		);
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
	 * @param  skipOnLoaded - Do not call `onLoaded` function.
	 * @return Store instance.
	 */
	async loadSegment(id: any, skipOnLoaded = false) {

		const { segmentsRegistry } = this;
		const registryItem = segmentsRegistry.get(id);

		// Already loaded.
		if (registryItem === null) {
			return this;
		}

		if (!registryItem) {
			throw new Error('Segment is doesn\'t registered.');
		}

		const {
			loader,
			onLoaded
		} = registryItem;
		const segmentConfig = await loader();
		const store = this.addSegment(segmentConfig);

		// Mark as loaded.
		segmentsRegistry.set(id, null);

		if (typeof onLoaded === 'function' && !skipOnLoaded) {
			await onLoaded(store);
		}

		return store;
	}

	/**
	 * Load segments from registry
	 * @param  ids - Segments identificators.
	 * @param  skipOnLoaded - Do not call `onLoaded` function.
	 * @return Store instance.
	 */
	async loadSegments(ids: any[], skipOnLoaded = false) {
		await Promise.all(
			ids.map(id => this.loadSegment(id, skipOnLoaded))
		);
		return this;
	}

	/**
	 * Load all segments from registry.
	 * @param  skipOnLoaded - Do not call `onLoaded` function.
	 * @return Store instance.
	 */
	loadAllSegments(skipOnLoaded = false) {

		const {
			segmentsRegistry
		} = this;

		return this.loadSegments(
			Array.from(segmentsRegistry.keys()),
			skipOnLoaded
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
		this.adapter = null;
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
	 * Original Redux store getter.
	 * @return Redux store.
	 */
	get reduxStore() {
		this.checkIfDestroyed();
		return this.store;
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

	/**
	 * `isEqual` adapter function getter.
	 * @return `isEqual` function.
	 */
	get isEqual() {
		this.checkIfDestroyed();
		return this.adapter.isEqual;
	}
}
