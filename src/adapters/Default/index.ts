import isEqual from './isEqual';
import {
	IStateAdapter
} from '../types';

const adapter: IStateAdapter = {

	getDefaultState() {
		return {};
	},

	has(state, namespace) {
		return state.hasOwnProperty(namespace) && state[namespace] !== null;
	},

	get(state, namespace) {
		return state[namespace];
	},

	set(state, namespace, value) {
		return {
			...state,
			[namespace]: value
		};
	},

	isEqual,

	wrapReducer(reducer) {
		return reducer;
	}
};

export default adapter;
