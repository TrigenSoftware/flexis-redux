
export default function mergeProps(
	stateProps: object,
	actionsProps: object,
	ownProps: object
): object {
	return {
		...stateProps,
		...actionsProps,
		...ownProps
	};
}
