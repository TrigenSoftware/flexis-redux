
const EMPTY_METHOD_NAME = 'value';
const {
	getPrototypeOf,
	prototype: objectProto
} = Object;

/**
 * Get all keys of all prototypes.
 * @param  proto - Target prototype.
 * @param  exclude - Keys to exclude.
 * @return Prototype keys.
 */
export function protoKeys(proto, exclude: string[] = []): string[] {

	if (proto === objectProto) {
		return [];
	}

	return [
		...Reflect.ownKeys(proto),
		...protoKeys(getPrototypeOf(proto), exclude)
	].filter(_ =>
		typeof _ === 'string'
		&& _ !== 'constructor'
		&& !exclude.includes(_)
	) as string[];
}

/**
 * Property of prototype is function or not.
 * @param  proto - Target prototype.
 * @param  prop - Prop name.
 * @return Result of checking.
 */
export function isFunctionProp(proto, prop: string): boolean {

	if (proto === objectProto) {
		return false;
	}

	const descriptor = Reflect.getOwnPropertyDescriptor(proto, prop);

	if (!descriptor) {
		return isFunctionProp(getPrototypeOf(proto), prop);
	}

	return typeof descriptor.value === 'function';
}

/**
 * Get method name.
 * @param  proto - Target prototype.
 * @param  name - Prop name.
 * @result Method name.
 */
export function getMethodName(proto, name: string) {

	const methodName = proto[name].name;

	return !methodName || methodName === EMPTY_METHOD_NAME
		? name
		: methodName;
}
