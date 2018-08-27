import { List } from 'immutable';
import { Reducer } from '../src';
import {
	State,
	ISetItemsAction,
	IAddItemAction,
	IRemoveItemAction
} from './Todos.types';

export default class TodosReducer extends Reducer {

	static namespace = 'todos';
	static initialState: State = List();

	setItems(state: State, { payload: items }: ISetItemsAction): State {
		return state.clear().push(...items);
	}

	addItem(state: State, { payload: text }: IAddItemAction): State {
		return state.push(text);
	}

	removeItem(state: State, { payload: index }: IRemoveItemAction): State {
		return state.delete(index);
	}
}
