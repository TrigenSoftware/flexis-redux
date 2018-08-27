
export default function mergeProps(
	stateProps,
	actionsProps,
	ownProps
) {
	return {
		...stateProps,
		...actionsProps,
		...ownProps
	};
}
