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
import lock from './utils/lock';
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
type OnSegmentLoaded<TState, TActions> = (
	store: Store<TState, TActions>,
	context?: Record<string, any>
) => void|Promise<void>;

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
	private readonly segmentsLocks = new Map<any, Promise<void>>();

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
	 * @param  context - Context to pass to `onLoaded` function.
	 * @param  skipOnLoaded - Do not call `onLoaded` function.
	 * @return Store instance.
	 */
	loadSegment(id: any, skipOnLoaded?: boolean): Promise<Store<TState, TActions>>;
	loadSegment(id: any, context?: Record<string, any>, skipOnLoaded?: boolean): Promise<Store<TState, TActions>>;
	async loadSegment(
		id: any,
		contextOrSkipOnLoaded?: boolean | Record<string, any>,
		maybeSkipOnLoaded?: boolean
	) {

		const [
			context,
			skipOnLoaded
		] = typeof contextOrSkipOnLoaded !== 'boolean'
			? [contextOrSkipOnLoaded || {}, maybeSkipOnLoaded]
			: [{}, contextOrSkipOnLoaded];
		const {
			segmentsRegistry,
			segmentsLocks
		} = this;
		const registryItem = segmentsRegistry.get(id);

		// Already loaded.
		if (registryItem === null) {
			return this;
		}

		if (!registryItem) {
			throw new Error('Segment is doesn\'t registered.');
		}

		const alreadyLocked = segmentsLocks.get(id);

		if (alreadyLocked) {
			await alreadyLocked;
			return this;
		}

		const [
			locked,
			unlock
		] = lock();

		segmentsLocks.set(id, locked);

		const {
			loader,
			onLoaded
		} = registryItem;
		const segmentConfig = await loader();
		const store = this.addSegment(segmentConfig);

		if (typeof onLoaded === 'function' && !skipOnLoaded) {
			await onLoaded(store, context);
		}

		// Mark as loaded.
		segmentsRegistry.set(id, null);
		segmentsLocks.delete(id);
		unlock();

		return store;
	}

	/**
	 * Load segments from registry
	 * @param  ids - Segments identificators.
	 * @param  context - Context to pass to `onLoaded` function.
	 * @param  skipOnLoaded - Do not call `onLoaded` function.
	 * @return Store instance.
	 */
	loadSegments(ids: any[], skipOnLoaded?: boolean): Promise<Store<TState, TActions>>;
	loadSegments(ids: any[], context?: Record<string, any>, skipOnLoaded?: boolean): Promise<Store<TState, TActions>>;
	async loadSegments(
		ids: any[],
		contextOrSkipOnLoaded?: boolean | Record<string, any>,
		maybeSkipOnLoaded?: boolean
	) {
		await Promise.all(
			ids.map(id => this.loadSegment(
				id,
				contextOrSkipOnLoaded as Record<string, any>,
				maybeSkipOnLoaded
			))
		);
		return this;
	}

	/**
	 * Load all segments from registry.
	 * @param  context - Context to pass to `onLoaded` function.
	 * @param  skipOnLoaded - Do not call `onLoaded` function.
	 * @return Store instance.
	 */
	loadAllSegments(skipOnLoaded?: boolean): Promise<Store<TState, TActions>>;
	loadAllSegments(context?: Record<string, any>, skipOnLoaded?: boolean): Promise<Store<TState, TActions>>;
	loadAllSegments(
		contextOrSkipOnLoaded?: boolean | Record<string, any>,
		maybeSkipOnLoaded?: boolean
	) {

		const {
			segmentsRegistry
		} = this;

		return this.loadSegments(
			Array.from(segmentsRegistry.keys()),
			contextOrSkipOnLoaded as Record<string, any>,
			maybeSkipOnLoaded
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
