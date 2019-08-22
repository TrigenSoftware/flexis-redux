const {
	hasOwnProperty
} = Object.prototype;

function is(a, b) {

	if (a === b) {
		return a !== 0 || b !== 0 || 1 / a === 1 / b;
	} else {
		return a !== a && b !== b;
	}
}

/**
 * Shallow equal check function.
 * @param  objA - A object.
 * @param  objB - B object.
 * @return Result of equality check.
 */
export default function isEqual(objA, objB) {

	if (is(objA, objB)) {
		return true;
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
