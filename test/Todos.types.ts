import { List } from 'immutable';

export type State = List<string>;

/**
 * SetItems
 */
export type SetItemsPayload = string[];

export interface ISetItemsAction {
	payload: SetItemsPayload;
}

/**
 * AddItem
 */
export type AddItemPayload = string;

export interface IAddItemAction {
	payload: AddItemPayload;
}

/**
 * RemoveItem
 */
export type RemoveItemPayload = number;

export interface IRemoveItemAction {
	payload: RemoveItemPayload;
}
