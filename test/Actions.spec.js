import {
	fromJS,
	is
} from 'immutable';
import TodosActions from './TodosActions';

describe('Actions', () => {

	const mockState = fromJS({
		todos: [
			'1st todo',
			'2nd todo'
		]
	});

	const mockStore = {
		state:    mockState,
		actions:  {},
		dispatch: () => {}
	};

	const mockReducersMap = {
		'todos/setItems':   'setItems',
		'todos/addItem':    'addItem',
		'todos/removeItem': 'removeItem'
	};

	const mockReducersMapWithoutNamespace = {
		'setItems':   'setItems',
		'addItem':    'addItem',
		'removeItem': 'removeItem'
	};

	it('should create correct instance', () => {

		const todos = new TodosActions(
			mockStore,
			mockReducersMap,
			'todos'
		);

		expect(typeof todos.setItems).toBe('function');
		expect(typeof todos.addItem).toBe('function');
		expect(typeof todos.removeItem).toBe('function');
	});

	it('should create correct instance without namespace', () => {

		const todos = new TodosActions(
			mockStore,
			mockReducersMapWithoutNamespace
		);

		expect(typeof todos.setItems).toBe('function');
		expect(typeof todos.addItem).toBe('function');
		expect(typeof todos.removeItem).toBe('function');
	});

	it('should define state getters', () => {

		const todos = new TodosActions(
			mockStore,
			mockReducersMap,
			'todos'
		);

		expect(is(
			todos.state,
			mockState.get('todos')
		)).toBe(true);

		expect(is(
			todos.globalState,
			mockState
		)).toBe(true);
	});

	it('should define state getters without namespace', () => {

		const todos = new TodosActions(
			{
				...mockStore,
				state: mockState.get('todos')
			},
			mockReducersMap
		);

		expect(is(
			todos.state,
			mockState.get('todos')
		)).toBe(true);

		expect(is(
			todos.globalState,
			mockState.get('todos')
		)).toBe(true);
	});

	it('should wrap methods', async () => {

		const dispatch = jest.fn();

		const todos = new TodosActions(
			{
				...mockStore,
				dispatch
			},
			mockReducersMap,
			'todos'
		);

		todos.addItem('todo');
		expect(await todos.loadItems()).toBe(true);
		expect(dispatch.mock.calls.length).toBe(3);
	});
});
