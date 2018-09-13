import {
	Context,
	createContext
} from 'react';

export interface IContext {
	storeState: any;
	actions: any;
	loadSegments(ids: any[]): Promise<void>;
	areSegmentsLoaded(ids: any[]): boolean;
}

export default createContext(null);
export { Context };
