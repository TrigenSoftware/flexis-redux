
export interface IMapFunction extends Function {
	dependsOnOwnProps?: boolean;
}

export default function initMapFunction<T extends IMapFunction>(fn?: T): T {

	if (typeof fn !== 'function') {
		return noop as T;
	}

	fn.dependsOnOwnProps = typeof fn.dependsOnOwnProps === 'boolean'
		? fn.dependsOnOwnProps
		: fn.length !== 1;

	return fn;
}

const noop: IMapFunction = () => ({});

noop.dependsOnOwnProps = false;
