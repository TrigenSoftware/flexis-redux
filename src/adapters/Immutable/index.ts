import {
	Map
} from 'immutable';
import isEqual from './isEqual';
import {
	IStateAdapter
} from '../types';

const adapter: IStateAdapter = {

	getDefaultState: Map,

	has(state, namespace) {
		return state.has(namespace) && state.get(namespace) !== null;
	},

	get(state, namespace) {
		return state.get(namespace);
	},

	set(state, namespace, value) {
		return state.set(namespace, value);
	},

	isEqual,

	wrapReducer(reducer) {
		return reducer;
	}
};

export default adapter;
