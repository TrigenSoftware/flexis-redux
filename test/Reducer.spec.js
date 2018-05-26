import {
	fromJS
} from 'immutable';
import TodosReducer from './TodosReducer';

describe.skip('Actions', () => {

	const mockState = fromJS({
		todos: [
			'1st todo',
			'2nd todo'
		]
	});

	it('should create correct instance', () => {

		const todos = new TodosReducer('todos');

		expect(typeof todos.setItems).toBe('function');
		expect(typeof todos.addItem).toBe('function');
		expect(typeof todos.removeItem).toBe('function');
	});

	it('should create correct instance without namespace', () => {

		const todos = new TodosReducer();

		expect(typeof todos.setItems).toBe('function');
		expect(typeof todos.addItem).toBe('function');
		expect(typeof todos.removeItem).toBe('function');
	});

	it('should apply reducer to the previous state', async () => {

		const todos = new TodosReducer('todos'),
			todosReducer = todos.createReducer();

		let state = fromJS({
			todos: []
		});

		state = todosReducer(mockState, {
			type:    'todos/addItem',
			payload: '1st todo'
		});
		state = todosReducer(mockState, {
			type:    'todos/addItem',
			payload: '2nd todo'
		});

		expect(state.get('todos').toJS()).toEqual([
			'1st todo',
			'2nd todo'
		]);

		state = todosReducer(mockState, {
			type:    'todos/removeItem',
			payload: 1
		});

		expect(state.get('todos').toJS()).toEqual([
			'1st todo'
		]);

		state = todosReducer(mockState, {
			type:    'todos/setItems',
			payload: []
		});

		expect(state.get('todos').toJS()).toEqual([]);
	});

	it('should apply reducer to the previous state without namespaces', async () => {

		const todos = new TodosReducer(),
			todosReducer = todos.createReducer();

		let state = fromJS([]);

		state = todosReducer(mockState, {
			type:    'addItem',
			payload: '1st todo'
		});
		state = todosReducer(mockState, {
			type:    'addItem',
			payload: '2nd todo'
		});

		expect(state.toJS()).toEqual([
			'1st todo',
			'2nd todo'
		]);

		state = todosReducer(mockState, {
			type:    'removeItem',
			payload: 1
		});

		expect(state.toJS()).toEqual([
			'1st todo'
		]);

		state = todosReducer(mockState, {
			type:    'setItems',
			payload: []
		});

		expect(state.toJS()).toEqual([]);
	});
});
