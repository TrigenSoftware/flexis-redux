
export default function lock(): [Promise<void>, () => void] {

	let unlock: () => void = null;
	const locked = new Promise<void>((resolve) => {
		unlock = resolve;
	});

	return [locked, unlock];
}
