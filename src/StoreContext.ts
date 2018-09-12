import {
	Context,
	createContext
} from 'react';

export interface IContext {
	storeState: any;
	actions: any;
	loadSegments(ids: any[]): Promise<void>;
}

export default createContext(null);
export { Context };
