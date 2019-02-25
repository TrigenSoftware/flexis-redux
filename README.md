# @flexis/redux

[![NPM version][npm]][npm-url]
[![Peer dependencies status][peer-deps]][peer-deps-url]
[![Dependencies status][deps]][deps-url]
[![Build status][build]][build-url]
[![Coverage status][coverage]][coverage-url]
[![Greenkeeper badge][greenkeeper]][greenkeeper-url]

[npm]: https://img.shields.io/npm/v/@flexis/redux.svg
[npm-url]: https://npmjs.com/package/@flexis/redux

[peer-deps]: https://david-dm.org/TrigenSoftware/flexis-redux/peer-status.svg
[peer-deps-url]: https://david-dm.org/TrigenSoftware/flexis-redux?type=peer

[deps]: https://david-dm.org/TrigenSoftware/flexis-redux.svg
[deps-url]: https://david-dm.org/TrigenSoftware/flexis-redux

[build]: http://img.shields.io/travis/com/TrigenSoftware/flexis-redux.svg
[build-url]: https://travis-ci.com/TrigenSoftware/flexis-redux

[coverage]: https://img.shields.io/coveralls/TrigenSoftware/flexis-redux.svg
[coverage-url]: https://coveralls.io/r/TrigenSoftware/flexis-redux

[greenkeeper]: https://badges.greenkeeper.io/TrigenSoftware/flexis-redux.svg
[greenkeeper-url]: https://greenkeeper.io/

Wrapper for [Redux](https://github.com/reactjs/redux), based on [ImmutableJS](https://github.com/facebook/immutable-js/).

## Install

```sh
npm i @flexis/redux
# or
yarn add @flexis/redux
```

## API

Module exposes next API:

```js
export default Store;
export {
	ICustomDispatcher,
	Reducer,
	ActionType,
	CustomDispatcher,
	createAction,
	Provider,
	Connect
};
```

[Description of this methods you can find in Documentation.](https://trigensoftware.github.io/flexis-redux/index.html)
