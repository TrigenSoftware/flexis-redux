import {
	List
} from 'immutable';
import isEqual from '../src/adapters/Immutable/isEqual';
import Selector from '../src/utils/Selector';

describe('Selector', () => {

	it('should create correct instance', () => {

		const selector = new Selector(isEqual);

		expect(selector.error).toBe(null);
		expect(selector.shouldComponentUpdate).toBe(true);
		expect(selector.props).toEqual({});
	});

	it('should correct destroy', () => {

		const selector = new Selector(isEqual);

		selector.run({ todos: List() }, {}, { prop: true });
		selector.destroy();

		expect(selector.error).toBe(null);
		expect(selector.shouldComponentUpdate).toBe(false);
		expect(selector.props).toEqual({});
	});

	it('should handle first call', () => {

		const state = { todos: List() };
		const actions = {};
		const props = {};
		const selector = new Selector(isEqual);

		selector.run(state, actions, props);

		expect(selector.shouldComponentUpdate).toBe(true);
	});

	it('should not set `shouldComponentUpdate` to `true` without map functions', () => {

		const state = { todos: List() };
		const actions = {};
		const props = {};
		const selector = new Selector(isEqual);

		selector.run(state, actions, props);
		selector.shouldComponentUpdate = false;
		selector.run(state, actions, props);

		expect(selector.shouldComponentUpdate).toBe(false);

		selector.shouldComponentUpdate = false;
		selector.run({ todos: List() }, {}, {});

		expect(selector.shouldComponentUpdate).toBe(false);

		const anotherActions = {
			action() {
				// Empty
			}
		};

		selector.shouldComponentUpdate = false;
		selector.run({ todos: List() }, anotherActions, {});

		expect(selector.shouldComponentUpdate).toBe(false);

		selector.shouldComponentUpdate = false;
		selector.run({}, anotherActions, {});

		expect(selector.shouldComponentUpdate).toBe(false);
	});

	it('should not set `shouldComponentUpdate` to `true` with `mapStateToProps`', () => {

		const state = { todos: List() };
		const actions = {};
		const props = {};
		const selector = new Selector(
			isEqual,
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
		selector.run({ todos: List() }, {
			action() {
				// Empty
			}
		}, {});

		expect(selector.shouldComponentUpdate).toBe(false);
	});

	it('should not set `shouldComponentUpdate` to `true` with `mapActionsToProps`', () => {

		const state = { todos: List() };
		const actions = {
			action() {
				// Empty
			}
		};
		const props = {};
		const selector = new Selector(
			isEqual,
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

		const state = { todos: List() };
		const actions = {
			action() {
				// Empty
			}
		};
		const props = {};
		const selector = new Selector(
			isEqual,
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

		const actions = {
			action() {
				// Empty
			}
		};
		const selector = new Selector(isEqual);

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
			isEqual,
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

		const actions = {
			action() {
				// Empty
			}
		};
		const selector = new Selector(
			isEqual,
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

		const actions = {
			action() {
				// Empty
			}
		};
		const selector = new Selector(
			isEqual,
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
