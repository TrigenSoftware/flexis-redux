import {
	is,
	isImmutable
} from 'immutable';

const { hasOwnProperty } = Object.prototype;

/**
 * Deep equal check function.
 * @param  objA - A object.
 * @param  objB - B object.
 * @return Result of equality check.
 */
export default function isEqual(objA, objB) {

	const equality = is(objA, objB);

	if (equality || isImmutable(objA) && isImmutable(objB)) {
		return equality;
	}

	if (typeof objA !== 'object' || objA === null
		|| typeof objB !== 'object' || objB === null
	) {
		return false;
	}

	const keysA = Object.keys(objA);
	const keysB = Object.keys(objB);

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
