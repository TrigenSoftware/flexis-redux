import {
	compose
} from 'redux';
import {
	isObject
} from './proto';

/**
 * Sort classes by having of namespace property.
 * @param  class - Target class.
 * @return Has namespace property or not.
 */
function sortClasses({ namespace }: { namespace: string }) {
	return namespace ? 1 : 0;
}

/**
 * Convert class, array of classes or object of classes to array of classes.
 * @param  inputClasses - Target to convert.
 * @param  usedClasses - Classes to exclude.
 * @return Array of classes.
 */
export function inputClassesToArray<T>(inputClasses, usedClasses: Set<any>): T[] {
	const classesArray = Array.isArray(inputClasses)
		? inputClasses
		: isObject(inputClasses)
			? Object.values(inputClasses)
			: [inputClasses];

	return classesArray
		.map((inputClass) => {

			if (usedClasses.has(inputClass)) {
				return null;
			}

			usedClasses.add(inputClass);

			return inputClass;
		})
		.filter(Boolean)
		.sort(sortClasses);
}

/**
 * Compose reducers.
 * @param  a - Reducer.
 * @param  b - Reducer or empty.
 * @return Composed reducers.
 */
export function composeReducers<
	A extends (...args: any[]) => unknown,
	B extends (...args: any[]) => unknown
>(a: A, b: B) {
	return b
		? compose(a, b)
		: a;
}

/**
 * Empty reducer.
 * @param  state - State.
 * @return State.
 */
export function noopReducer(state) {
	return state;
}
