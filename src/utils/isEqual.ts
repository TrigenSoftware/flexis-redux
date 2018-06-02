import { is } from 'immutable';

const { hasOwnProperty } = Object.prototype;

export default function isEqual(objA, objB) {

	if (is(objA, objB)) {
		return true;
	}

	if (typeof objA !== 'object' || objA === null
		|| typeof objB !== 'object' || objB === null
	) {
		return false;
	}

	const keysA = Object.keys(objA),
		keysB = Object.keys(objB);

	if (keysA.length !== keysB.length) {
		return false;
	}

	for (const keyA of keysA) {

		if (!Reflect.apply(hasOwnProperty, objB, [keyA])
			|| !is(objA[keyA], objB[keyA])
		) {
			return false;
		}
	}

	return true;
}
