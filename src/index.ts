import Store from './Store';
import Reducer, {
	ActionType
} from './Reducer';
import {
	ICustomDispatcher,
	CustomDispatcher,
	createAction
} from './Actions';
import Provider from './Provider';
import Connect from './Connect';

export * from './adapters';

export default Store;
export {
	ICustomDispatcher,
	Reducer,
	ActionType,
	CustomDispatcher,
	createAction,
	Provider,
	Connect
};
