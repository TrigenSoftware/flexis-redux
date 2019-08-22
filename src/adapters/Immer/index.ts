import produce from 'immer';
import DefaultAdapter from '../Default';
import {
	IStateAdapter
} from '../types';

const adapter: IStateAdapter = {
	...DefaultAdapter,

	set(state, namespace, value) {

		if (typeof value === 'undefined') {
			return;
		}

		return DefaultAdapter.set(state, namespace, value);
	},

	wrapReducer(reducer) {
		return (state, action) => produce(
			state,
			draft => reducer(draft, action)
		);
	}
};

export default adapter;
