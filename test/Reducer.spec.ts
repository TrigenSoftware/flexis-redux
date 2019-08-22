import {
	fromJS,
	List
} from 'immutable';
import {
	ImmutableAdapter
} from '../src/adapters';
import {
	createReducer,
	getReducersMap
} from '../src/Reducer';
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

		const todosReducer = createReducer(ImmutableAdapter, TodosReducer);
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

		const todosReducer = createReducer(ImmutableAdapter, TodosReducerNoNamespaced);
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

	describe('getReducersMap', () => {

		it('should get correct methods names', () => {

			function FakeReducer() {}
			// tslint:disable-next-line: only-arrow-functions
			FakeReducer.prototype.methodA = function() {};
			FakeReducer.prototype.methodB = function b() {};
			Reflect.defineProperty(FakeReducer.prototype, 'methodC', {
				// tslint:disable-next-line
				value: function() {}
			});
			Reflect.defineProperty(FakeReducer.prototype, 'methodE', {
				// tslint:disable-next-line
				value: function e() {}
			});

			expect(
				getReducersMap(FakeReducer as any)
			).toMatchObject({
				methodA: 'methodA',
				b:       'methodB',
				methodC: 'methodC',
				e:       'methodE'
			});
		});
	});
});
