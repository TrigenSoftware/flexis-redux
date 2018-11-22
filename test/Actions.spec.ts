import {
	fromJS,
	is
} from 'immutable';
import Store, {
	CustomDispatcher
} from '../src';
import {
	State,
	SetItemsPayload
} from './Todos.types';
import TodosReducer from './Todos.reducer';
import TodosActions from './Todos.actions';

function createMockStore(
	mockState: any,
	mockDispatch = () => {}
): Store {
	return Object.assign(
		Object.create(Store.prototype),
		{
			store: {
				getState: () => mockState,
				dispatch: mockDispatch
			},
			storeActions: {}
		}
	);
}

describe('Actions', () => {

	const mockState = fromJS({
		todos: [
			'1st todo',
			'2nd todo'
		]
	});

	const mockStore: Store = createMockStore(mockState);

	it('should create correct instance', () => {

		const todos: TodosActions = new (TodosActions as any)(mockStore);

		expect(typeof todos.loadItems).toBe('function');
		expect(typeof todos.setItems).toBe('function');
		expect(typeof todos.addItem).toBe('function');
		expect(typeof todos.removeItem).toBe('function');
	});

	it('should define state getters', () => {

		const todos: TodosActions = new (TodosActions as any)(mockStore);

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

		abstract class TodosActionsNoNamespaced extends TodosActions {
			static namespace = undefined;
		}

		const todos: TodosActions = new (TodosActionsNoNamespaced as any)(
			createMockStore(mockState.get('todos'))
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

		const todos: TodosActions = new (TodosActions as any)(
			createMockStore(mockState, dispatch)
		);

		todos.addItem('todo');
		expect(await todos.loadItems()).toBe(true);
		expect(dispatch.mock.calls.length).toBe(3);
	});

	it('should apply custom dispatcher', () => {

		const customDispatcher = jest.fn();
		const dispatch = jest.fn();

		class TodosActions extends TodosReducer.Actions<State> {

			@CustomDispatcher(customDispatcher)
			setItems(payload: SetItemsPayload) {}
		}

		const todos: TodosActions = new (TodosActions as any)(
			createMockStore(mockState, dispatch)
		);

		todos.setItems(['todo']);
		expect(dispatch.mock.calls.length).toBe(0);
		expect(customDispatcher.mock.calls.length).toBe(1);
	});

	it('should not apply custom dispatcher', () => {

		expect(() => {
			class TodosActions extends TodosReducer.Actions<State> {

				@CustomDispatcher(() => {})
				notDispatcher() {}
			}
		}).toThrow(/is not dispatcher/);
	});
});
