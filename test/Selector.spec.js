import { List } from 'immutable';
import Selector from '../src/utils/Selector';

describe('Selector', () => {

	it('should create correct instance', () => {

		const selector = new Selector();

		expect(typeof selector.mapStateToProps).toBe('function');
		expect(typeof selector.mapActionsToProps).toBe('function');
		expect(typeof selector.mergeProps).toBe('function');
		expect(selector.error).toBe(null);
		expect(selector.shouldComponentUpdate).toBe(true);
		expect(selector.hasRunAtLeastOnce).toBe(false);
		expect(selector.props).toEqual({});
		expect(selector.state).toEqual({});
		expect(selector.actions).toEqual({});
		expect(selector.ownProps).toEqual({});
		expect(selector.stateProps).toEqual({});
		expect(selector.actionsProps).toEqual({});
		expect(selector.mergedProps).toEqual({});
	});

	it('should correct destroy', () => {

		const selector = new Selector();

		selector.run({ todos: List() }, {}, { prop: true });

		selector.destroy();

		expect(selector.mapActionsToProps).toBe(selector.mapStateToProps);
		expect(selector.mergeProps).toBe(selector.mapStateToProps);
		expect(selector.error).toBe(null);
		expect(selector.shouldComponentUpdate).toBe(false);
		expect(selector.hasRunAtLeastOnce).toBe(false);
		expect(selector.props).toEqual({});
		expect(selector.state).toEqual({});
		expect(selector.actions).toEqual({});
		expect(selector.ownProps).toEqual({});
		expect(selector.stateProps).toEqual({});
		expect(selector.actionsProps).toEqual({});
		expect(selector.mergedProps).toEqual({});
	});

	it('should handle first call', () => {

		const state = { todos: List() },
			actions = {},
			props = {};

		const selector = new Selector();

		selector.run(state, actions, props);

		expect(selector.shouldComponentUpdate).toBe(true);
		expect(selector.hasRunAtLeastOnce).toBe(true);
	});

	it('should not set `shouldComponentUpdate` to `true` without map functions', () => {

		const state = { todos: List() },
			actions = {},
			props = {};

		const selector = new Selector();

		selector.run(state, actions, props);
		selector.shouldComponentUpdate = false;
		selector.run(state, actions, props);

		expect(selector.shouldComponentUpdate).toBe(false);

		selector.shouldComponentUpdate = false;
		selector.run({ todos: List() }, {}, {});

		expect(selector.shouldComponentUpdate).toBe(false);

		const anotherActions = { action() {} };

		selector.shouldComponentUpdate = false;
		selector.run({ todos: List() }, anotherActions, {});

		expect(selector.shouldComponentUpdate).toBe(false);

		selector.shouldComponentUpdate = false;
		selector.run({}, anotherActions, {});

		expect(selector.shouldComponentUpdate).toBe(false);
	});

	it('should not set `shouldComponentUpdate` to `true` with `mapStateToProps`', () => {

		const state = { todos: List() },
			actions = {},
			props = {};

		const selector = new Selector(
			state => ({ todos: state.todos })
		);

		selector.run(state, actions, props);
		selector.shouldComponentUpdate = false;
		selector.run(state, actions, props);

		expect(selector.shouldComponentUpdate).toBe(false);

		selector.shouldComponentUpdate = false;
		selector.run({ todos: List() }, {}, {});

		expect(selector.shouldComponentUpdate).toBe(false);

		selector.shouldComponentUpdate = false;
		selector.run({ todos: List() }, { action() {} }, {});

		expect(selector.shouldComponentUpdate).toBe(false);
	});

	it('should not set `shouldComponentUpdate` to `true` with `mapActionsToProps`', () => {

		const state = { todos: List() },
			actions = { action() {} },
			props = {};

		const selector = new Selector(
			null,
			actions => ({ action: actions.action })
		);

		selector.run(state, actions, props);
		selector.shouldComponentUpdate = false;
		selector.run(state, actions, props);

		expect(selector.shouldComponentUpdate).toBe(false);

		selector.shouldComponentUpdate = false;
		selector.run({ todos: List() }, actions, {});

		expect(selector.shouldComponentUpdate).toBe(false);
	});

	it('should not set `shouldComponentUpdate` to `true` with `mapStateToProps` and `mapActionsToProps`', () => {

		const state = { todos: List() },
			actions = { action() {} },
			props = {};

		const selector = new Selector(
			state => ({ todos: state.todos }),
			actions => ({ action: actions.action })
		);

		selector.run(state, actions, props);
		selector.shouldComponentUpdate = false;
		selector.run(state, actions, props);

		expect(selector.shouldComponentUpdate).toBe(false);

		selector.shouldComponentUpdate = false;
		selector.run({ todos: List() }, actions, {});

		expect(selector.shouldComponentUpdate).toBe(false);
	});

	it('should set `shouldComponentUpdate` to `true` without map functions', () => {

		const actions = { action() {} };

		const selector = new Selector();

		selector.run({ todos: List() }, {}, {});

		selector.shouldComponentUpdate = false;
		selector.run({ todos: List(['1st todo']) }, actions, {});

		expect(selector.shouldComponentUpdate).toBe(true);

		selector.shouldComponentUpdate = false;
		selector.run({ todos: List(['1st todo']) }, actions, { prop: true });

		expect(selector.shouldComponentUpdate).toBe(true);
	});

	it('should set `shouldComponentUpdate` to `true` with `mapStateToProps`', () => {

		const selector = new Selector(
			state => ({ todos: state.todos })
		);

		selector.run({ todos: List() }, {}, {});

		selector.shouldComponentUpdate = false;
		selector.run({ todos: List([1]) }, {}, {});

		expect(selector.shouldComponentUpdate).toBe(true);

		selector.shouldComponentUpdate = false;
		selector.run({ todos: List([1]) }, {}, { prop: true });

		expect(selector.shouldComponentUpdate).toBe(true);
	});

	it('should set `shouldComponentUpdate` to `true` with `mapActionsToProps`', () => {

		const actions = { action() {} };

		const selector = new Selector(
			null,
			actions => ({ action: actions.action })
		);

		selector.run({ todos: List() }, {}, {});

		selector.shouldComponentUpdate = false;
		selector.run({ todos: List() }, actions, {});

		expect(selector.shouldComponentUpdate).toBe(true);

		selector.shouldComponentUpdate = false;
		selector.run({ todos: List() }, actions, { prop: true });

		expect(selector.shouldComponentUpdate).toBe(true);

		selector.shouldComponentUpdate = false;
		selector.run({ todos: List() }, {}, { prop: false });

		expect(selector.shouldComponentUpdate).toBe(true);
	});

	it('should set `shouldComponentUpdate` to `true` with `mapStateToProps` and `mapActionsToProps`', () => {

		const actions = { action() {} };

		const selector = new Selector(
			state => ({ todos: state.todos }),
			actions => ({ action: actions.action })
		);

		selector.run({ todos: List() }, {}, {});

		selector.shouldComponentUpdate = false;
		selector.run({ todos: List([1]) }, {}, {});

		expect(selector.shouldComponentUpdate).toBe(true);

		selector.shouldComponentUpdate = false;
		selector.run({ todos: List([1]) }, actions, {});

		expect(selector.shouldComponentUpdate).toBe(true);

		selector.shouldComponentUpdate = false;
		selector.run({ todos: List([1]) }, actions, { prop: true });

		expect(selector.shouldComponentUpdate).toBe(true);

		selector.shouldComponentUpdate = false;
		selector.run({ todos: List([1]) }, {}, { prop: false });

		expect(selector.shouldComponentUpdate).toBe(true);
	});
});
