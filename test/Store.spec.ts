import {
	Map,
	List,
	fromJS,
	is
} from 'immutable';
import Store from '../src/Store';
import TodosReducer from './TodosReducer';

describe('Store', () => {

	it('should create correct instance', () => {

		const store = new Store({
			reducer: {
				todos: TodosReducer
			}
		});

		expect(typeof store.subscribe).toBe('function');
		expect(typeof store.dispatch).toBe('function');
		expect(store.state).toBeInstanceOf(Map);
		expect(store.state.get('todos')).toBeInstanceOf(List);

		expect(store.actions).toBeInstanceOf(Object);

		const { todos } = store.actions;

		expect(todos).toBeInstanceOf(Object);
		expect(typeof todos.setItems).toBe('function');
		expect(typeof todos.addItem).toBe('function');
		expect(typeof todos.removeItem).toBe('function');
	});

	it('should correct destroy', () => {

		const store = new Store({
			reducer: {
				todos: TodosReducer
			}
		});

		store.destroy();

		expect(() => store.state).toThrowError();
	});

	it('should create instance without namespaces', () => {

		const store = new Store({
			reducer: TodosReducer
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

		const store = new Store({
			reducer: {
				todos: TodosReducer
			}
		});

		store.dispatch({
			type:    'todos/addItem',
			payload: '1st todo'
		});
		expect(store.state.get('todos').toJS()).toEqual(['1st todo']);
	});

	it('should change state by dispatch without namespace', () => {

		const store = new Store({
			reducer: TodosReducer
		});

		store.dispatch({
			type:    'addItem',
			payload: '1st todo'
		});
		expect(store.state.toJS()).toEqual(['1st todo']);
	});

	it('should change state by dispatch with multiple namespaces', () => {

		const store = new Store({
			reducer: {
				todos: TodosReducer,
				tasks: TodosReducer
			}
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

		const forceState = {
			todos: [
				'1st todo',
				'2nd todo'
			]
		};

		const store = new Store({
			reducer: {
				todos: TodosReducer
			},
			forceState
		});

		expect(is(
			store.state,
			fromJS(forceState)
		)).toBe(true);
	});
});
