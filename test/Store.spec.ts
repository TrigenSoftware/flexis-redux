import {
	Record,
	Map,
	List,
	fromJS,
	is
} from 'immutable';
import Store from '../src';
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
			reducer: [TodosReducer],
			state: State()
		});

		store.destroy();

		expect(() => store.state).toThrowError();
	});

	it('should create instance without namespaces', () => {

		const store = new Store<TodosState, TodosActions>({
			reducer: TodosReducer,
			actions: TodosActions,
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

	it('should change state by dispatch', () => {

		const store = new Store<State>({
			reducer: [TodosReducer],
			state: State()
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
			reducer: TodosReducerNoNamespaced,
			state: List()
		});

		store.dispatch({
			type:    'addItem',
			payload: '1st todo'
		});
		expect(store.state.toJS()).toEqual(['1st todo']);
	});

	it('should change state by dispatch with multiple namespaces', () => {
		/* tslint:disable:max-classes-per-file */
		class TasksReducer extends TodosReducer {
			static namespace = 'tasks';
		}
		/* tslint:enable:max-classes-per-file */

		interface IExtendedStateProps extends IStateProps {
			tasks: TodosState;
		}

		type ExtendedState = ReturnType<Record.Factory<IExtendedStateProps>>;

		const ExtendedState = Record<IExtendedStateProps>({
			todos: null,
			tasks: null
		});

		const store = new Store<ExtendedState>({
			reducer: [TodosReducer, TasksReducer],
			state: ExtendedState()
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

	it('should set force state', () => {

		const forceState = State({
			todos: List([
				'1st todo',
				'2nd todo'
			])
		});

		const store = new Store({
			reducer: [TodosReducer],
			state: forceState
		});

		expect(is(
			store.state,
			forceState
		)).toBe(true);
	});
});
