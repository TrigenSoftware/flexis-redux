import Reducer from '../src/Reducer';

export default class TodosReducer extends Reducer {

	static initialState = [];

	setItems(state, { payload: items }) {
		return state.clear().push(...items);
	}

	addItem(state, { payload: text }) {
		return state.push(text);
	}

	removeItem(state, { payload: index }) {
		return state.delete(index);
	}
}
