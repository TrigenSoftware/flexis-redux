
const {
	getPrototypeOf,
	prototype: objectProto
} = Object;

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
