import Store, {
	ImmerAdapter,
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
		return items;
	}

	addItem(draft, { payload: text }) {
		draft.push(text);
	}

	removeItem(draft, { payload: index }) {
		draft.splice(index, 1);
	}
}

class TodosReducerNoNamespaced extends TodosReducer {
	static namespace = undefined;
}

describe('ImmerAdapter', () => {

	it('should set correct default state', () => {

		const state = State();
		const store = new Store({
			adapter: ImmerAdapter,
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
			adapter: ImmerAdapter,
			reducer: TodosReducerNoNamespaced,
			state:   State().todos
		});

		expect(store.state).toEqual([]);
	});

	it('should change state by dispatch', () => {

		let state = State();
		const store = new Store({
			adapter: ImmerAdapter,
			reducer: TodosReducer,
			state
		});

		store.dispatch({
			type:    'todos/addItem',
			payload: '1st todo'
		});

		expect(store.state.todos).toEqual(['1st todo']);
		expect(store.state).not.toBe(state);

		state = store.state;

		store.dispatch({
			type:    'todos/setItems',
			payload: [
				'1st todo',
				'2nd todo'
			]
		});

		expect(store.state.todos).toEqual([
			'1st todo',
			'2nd todo'
		]);
		expect(store.state).not.toBe(state);
	});

	it('should change state by dispatch without namespace', () => {

		const store = new Store({
			adapter: ImmerAdapter,
			reducer: TodosReducerNoNamespaced,
			state:   State().todos
		});
		let state = store.state;

		expect(state).toEqual([]);

		store.dispatch({
			type:    'addItem',
			payload: '1st todo'
		});

		expect(store.state).toEqual(['1st todo']);
		expect(store.state).not.toBe(state);

		state = store.state;

		store.dispatch({
			type:    'setItems',
			payload: [
				'1st todo',
				'2nd todo'
			]
		});

		expect(store.state).toEqual([
			'1st todo',
			'2nd todo'
		]);
		expect(store.state).not.toBe(state);
	});
});
