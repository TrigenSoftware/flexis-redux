/**
 * Function to merge all props.
 * @param  stateProps - State props.
 * @param  actionsProps - Actions props.
 * @param  ownProps - Own props.
 * @return Merged props.
 */
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
