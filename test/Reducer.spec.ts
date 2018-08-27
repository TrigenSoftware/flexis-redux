import {
	fromJS,
	List
} from 'immutable';
import { createReducer } from '../src/Reducer';
import TodosReducer from './Todos.reducer';

describe('Reducer', () => {

	const mockState = fromJS({
		todos: [
			'1st todo',
			'2nd todo'
		]
	});

	it('should create correct instance', () => {

		const todos = new TodosReducer();

		expect(typeof todos.setItems).toBe('function');
		expect(typeof todos.addItem).toBe('function');
		expect(typeof todos.removeItem).toBe('function');
	});

	it('should apply reducer to the previous state', async () => {

		const todosReducer = createReducer(TodosReducer);
		let state = fromJS({
			todos: []
		});

		state = todosReducer(state, {
			type:    'todos/addItem',
			payload: '1st todo'
		});
		state = todosReducer(state, {
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

		class TodosReducerNoNamespaced extends TodosReducer {
			static namespace = undefined;
		}

		const todosReducer = createReducer(TodosReducerNoNamespaced);
		let state = List();

		state = todosReducer(state, {
			type:    'addItem',
			payload: '1st todo'
		});

		state = todosReducer(state, {
			type:    'addItem',
			payload: '2nd todo'
		});

		expect(state.toJS()).toEqual([
			'1st todo',
			'2nd todo'
		]);

		state = todosReducer(state, {
			type:    'removeItem',
			payload: 1
		});

		expect(state.toJS()).toEqual([
			'1st todo'
		]);

		state = todosReducer(state, {
			type:    'setItems',
			payload: []
		});

		expect(state.toJS()).toEqual([]);
	});
});
