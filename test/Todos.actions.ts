import TodosReducer from './Todos.reducer';
import {
	State,
	SetItemsPayload,
	AddItemPayload,
	RemoveItemPayload
} from './Todos.types';

const TIMEOUT = 300;

function timeout(time: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, time);
	});
}

export default abstract class TodosActions extends TodosReducer.Actions<State> {

	abstract setItems(payload: SetItemsPayload);
	abstract addItem(payload: AddItemPayload);
	abstract removeItem(payload: RemoveItemPayload);

	async loadItems() {
		this.setItems([]);
		await timeout(TIMEOUT);
		this.setItems([
			'todo "from server"'
		]);
		return true;
	}
}
