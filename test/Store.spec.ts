import {
	Record,
	List,
	is
} from 'immutable';
import {
	Action
} from 'redux';
import Store, {
	ImmutableAdapter,
	Reducer
} from '../src';
import TodosReducer from './Todos.reducer';
import TodosActions from './Todos.actions';
import {
	State as TodosState
} from './Todos.types';

interface IStateProps {
	todos: TodosState;
}

type State = ReturnType<Record.Factory<IStateProps>>;

const State = Record<IStateProps>({
	todos: null
});

interface IActions {
	todos: TodosActions;
}

describe('Store', () => {

	it('should create correct instance', () => {

		const store = new Store<State, IActions>({
			adapter: ImmutableAdapter,
			reducer: [TodosReducer],
			actions: [TodosActions],
			state: State()
		});

		expect(typeof store.subscribe).toBe('function');
		expect(typeof store.dispatch).toBe('function');
		expect(store.state).toBeInstanceOf(State);
		expect(store.state.todos).toBeInstanceOf(List);

		expect(store.actions).toBeInstanceOf(Object);

		const { todos } = store.actions;

		expect(todos).toBeInstanceOf(Object);
		expect(typeof todos.setItems).toBe('function');
		expect(typeof todos.addItem).toBe('function');
		expect(typeof todos.removeItem).toBe('function');
	});

	it('should correct destroy', () => {

		const store = new Store<State>({
			adapter: ImmutableAdapter,
			reducer: [TodosReducer],
			state: State()
		});

		store.destroy();

		expect(() => store.state).toThrowError();
	});

	it('should create instance without namespaces', () => {

		class TodosReducerNoNamespaced extends TodosReducer {
			static namespace = undefined;
		}

		abstract class TodosActionsNoNamespaced extends TodosActions {
			static namespace = undefined;
		}

		const store = new Store<TodosState, TodosActions>({
			adapter: ImmutableAdapter,
			reducer: TodosReducerNoNamespaced,
			actions: TodosActionsNoNamespaced,
			state: List()
		});

		expect(typeof store.subscribe).toBe('function');
		expect(typeof store.dispatch).toBe('function');
		expect(store.state).toBeInstanceOf(List);

		const { actions } = store;

		expect(typeof actions.setItems).toBe('function');
		expect(typeof actions.addItem).toBe('function');
		expect(typeof actions.removeItem).toBe('function');
	});

	it('should create instance with hybrid state', () => {

		class RootReducer extends Reducer {

			addTodoItem(state: State, { payload }) {
				const { todos } = state;
				return state.set('todos', todos.push(payload));
			}
		}

		abstract class RootActions extends RootReducer.Actions {
			abstract addTodoItem(payload: string);
		}

		interface IHybridActions extends RootActions, IActions {
		}

		const store = new Store<State, IHybridActions>({
			adapter: ImmutableAdapter,
			reducer: [RootReducer, TodosReducer],
			actions: [RootActions, TodosActions],
			state: State()
		});

		expect(store.state).toBeInstanceOf(State);
		expect(store.state.todos).toBeInstanceOf(List);

		const { actions } = store;

		expect(actions).toBeInstanceOf(Object);
		expect(typeof actions.addTodoItem).toBe('function');

		const { todos } = actions;

		expect(todos).toBeInstanceOf(Object);
		expect(typeof todos.setItems).toBe('function');
		expect(typeof todos.addItem).toBe('function');
		expect(typeof todos.removeItem).toBe('function');
	});

	it('should add reducer on the fly', () => {

		const store = new Store<State, IActions>({
			adapter: ImmutableAdapter,
			state:   State({
				todos: List()
			})
		});

		expect(store.actions).toEqual({});

		store.dispatch({
			type:    'todos/addItem',
			payload: '1st todo'
		});
		expect(store.state.todos.toJS()).toEqual([]);

		store.addSegment({
			reducer: TodosReducer,
			actions: TodosActions
		});

		const { todos } = store.actions;

		expect(todos).toBeInstanceOf(Object);
		expect(typeof todos.setItems).toBe('function');
		expect(typeof todos.addItem).toBe('function');
		expect(typeof todos.removeItem).toBe('function');

		store.dispatch({
			type:    'todos/addItem',
			payload: '1st todo'
		});
		expect(store.state.todos.toJS()).toEqual(['1st todo']);
	});

	it('should add reducer on the fly via registry', async () => {

		const store = new Store<State, IActions>({
			adapter: ImmutableAdapter,
			state:   State({
				todos: List()
			})
		});

		expect(store.actions).toEqual({});

		store.dispatch({
			type:    'todos/addItem',
			payload: '1st todo'
		});
		expect(store.state.todos.toJS()).toEqual([]);

		store.registerSegment('todos', async () => ({
			reducer: TodosReducer,
			actions: TodosActions
		}));
		await store.loadSegment('todos');

		const { todos } = store.actions;

		expect(todos).toBeInstanceOf(Object);
		expect(typeof todos.setItems).toBe('function');
		expect(typeof todos.addItem).toBe('function');
		expect(typeof todos.removeItem).toBe('function');

		store.dispatch({
			type:    'todos/addItem',
			payload: '1st todo'
		});
		expect(store.state.todos.toJS()).toEqual(['1st todo']);
	});

	it('should change state by dispatch', () => {

		const store = new Store<State>({
			adapter: ImmutableAdapter,
			reducer: TodosReducer,
			state:   State()
		});

		store.dispatch({
			type:    'todos/addItem',
			payload: '1st todo'
		});
		expect(store.state.todos.toJS()).toEqual(['1st todo']);
	});

	it('should change state by dispatch without namespace', () => {

		class TodosReducerNoNamespaced extends TodosReducer {
			static namespace = undefined;
		}

		const store = new Store<TodosState>({
			adapter: ImmutableAdapter,
			reducer: TodosReducerNoNamespaced,
			state:   List()
		});

		store.dispatch({
			type:    'addItem',
			payload: '1st todo'
		});
		expect(store.state.toJS()).toEqual(['1st todo']);
	});

	it('should change state by dispatch with multiple namespaces', () => {

		class TasksReducer extends TodosReducer {
			static namespace = 'tasks';
		}

		interface IExtendedStateProps extends IStateProps {
			tasks: TodosState;
		}

		type ExtendedState = ReturnType<Record.Factory<IExtendedStateProps>>;

		const ExtendedState = Record<IExtendedStateProps>({
			todos: null,
			tasks: null
		});

		const store = new Store<ExtendedState>({
			adapter: ImmutableAdapter,
			reducer: [TodosReducer, TasksReducer],
			state:   ExtendedState()
		});

		store.dispatch({
			type:    'todos/addItem',
			payload: '1st todo'
		});
		store.dispatch({
			type:    'tasks/addItem',
			payload: '1st task'
		});
		expect(store.state.toJS()).toEqual({
			todos: ['1st todo'],
			tasks: ['1st task']
		});
	});

	it('should change state by dispatch with hybrid state', () => {

		class RootReducer extends Reducer {

			addTodoItem(state: State, { payload }) {
				const { todos } = state;
				return state.set('todos', todos.push(payload));
			}
		}

		const store = new Store<State>({
			adapter: ImmutableAdapter,
			reducer: { RootReducer, TodosReducer },
			state:   State()
		});

		store.dispatch({
			type:    'todos/addItem',
			payload: '1st todo'
		});
		store.dispatch({
			type:    'addTodoItem',
			payload: '2nd todo'
		});
		expect(store.state.toJS()).toEqual({
			todos: [
				'1st todo',
				'2nd todo'
			]
		});
	});

	it('should set force state', () => {

		const forceState = State({
			todos: List([
				'1st todo',
				'2nd todo'
			])
		});

		const store = new Store({
			adapter: ImmutableAdapter,
			reducer: TodosReducer,
			state:   forceState
		});

		expect(is(
			store.state,
			forceState
		)).toBe(true);
	});

	it('should work with rare reducer', () => {

		const store = new Store<TodosState>({
			adapter: ImmutableAdapter,
			reducer: (state: List<string>, action: Action) => {
				return state.push(action.type);
			},
			state:   List()
		});

		store.dispatch({
			type: 'someAction'
		});
		expect(store.state.last()).toEqual('someAction');
	});
});
