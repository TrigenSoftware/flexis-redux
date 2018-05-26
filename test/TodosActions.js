import Actions from '../src/Actions';

const TIMEOUT = 300;

export default class TodosActions extends Actions {

	async loadItems() {
		this.setItems([]);
		await timeout(TIMEOUT);
		this.setItems([
			'todo "from server"'
		]);
		return true;
	}
}

function timeout(time) {
	return new Promise((resolve) => {
		setTimeout(resolve, time);
	});
}
