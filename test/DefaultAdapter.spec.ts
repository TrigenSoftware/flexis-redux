import Store, {
	DefaultAdapter,
	Reducer
} from '../src';

function State() {
	return {
		todos: null
	};
}

class TodosReducer extends Reducer {

	static namespace = 'todos';
	static initialState = [];

	setItems(_, { payload: items }) {
		return [...items];
	}

	addItem(state, { payload: text }) {
		return [...state, text];
	}

	removeItem(state, { payload: index }) {
		return state.slice().splice(index, 1);
	}
}

class TodosReducerNoNamespaced extends TodosReducer {
	static namespace = undefined;
}

describe('DefaultAdapter', () => {

	it('should set correct default state', () => {

		const state = State();
		const store = new Store({
			adapter: DefaultAdapter,
			reducer: TodosReducer,
			state
		});

		expect(store.state).toEqual({
			todos: []
		});
		expect(store.state).not.toBe(state);
	});

	it('should create instance without namespaces', () => {

		const store = new Store({
			adapter: DefaultAdapter,
			reducer: TodosReducerNoNamespaced,
			state:   State().todos
		});

		expect(store.state).toEqual([]);
	});

	it('should change state by dispatch', () => {

		const state = State();
		const store = new Store({
			adapter: DefaultAdapter,
			reducer: TodosReducer,
			state
		});

		store.dispatch({
			type:    'todos/addItem',
			payload: '1st todo'
		});

		expect(store.state.todos).toEqual(['1st todo']);
		expect(store.state).not.toBe(state);
	});

	it('should change state by dispatch without namespace', () => {

		const store = new Store({
			adapter: DefaultAdapter,
			reducer: TodosReducerNoNamespaced,
			state:   State().todos
		});

		store.dispatch({
			type:    'addItem',
			payload: '1st todo'
		});

		expect(store.state).toEqual(['1st todo']);
	});
});
