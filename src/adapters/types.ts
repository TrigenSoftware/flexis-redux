import {
	Reducer as ReduxReducer
} from 'redux';

export interface IStateAdapter {
	getDefaultState(): any;
	has(state: any, namespace: string);
	get(state: any, namespace: string);
	set(state: any, namespace: string, value: any);
	isEqual(a: any, b: any);
	wrapReducer(reducer: ReduxReducer): ReduxReducer;
}
