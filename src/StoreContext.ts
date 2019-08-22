import {
	Context,
	createContext
} from 'react';

export interface IContext {
	storeState: any;
	actions: any;
	loadSegments(ids: any[]): Promise<void>;
	areSegmentsLoaded(ids: any[]): boolean;
	isEqual(a: any, b: any): boolean;
}

export default createContext<IContext>(null);
export { Context };
