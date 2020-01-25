# @flexis/redux

[![NPM version][npm]][npm-url]
[![Peer dependencies status][peer-deps]][peer-deps-url]
[![Dependencies status][deps]][deps-url]
[![Build status][build]][build-url]
[![Coverage status][coverage]][coverage-url]
[![Dependabot badge][dependabot]][dependabot-url]
[![Documentation badge][documentation]][documentation-url]

[npm]: https://img.shields.io/npm/v/@flexis/redux.svg
[npm-url]: https://npmjs.com/package/@flexis/redux

[peer-deps]: https://david-dm.org/TrigenSoftware/flexis-redux/peer-status.svg
[peer-deps-url]: https://david-dm.org/TrigenSoftware/flexis-redux?type=peer

[deps]: https://david-dm.org/TrigenSoftware/flexis-redux.svg
[deps-url]: https://david-dm.org/TrigenSoftware/flexis-redux

[build]: http://img.shields.io/travis/com/TrigenSoftware/flexis-redux/master.svg
[build-url]: https://travis-ci.com/TrigenSoftware/flexis-redux

[coverage]: https://img.shields.io/coveralls/TrigenSoftware/flexis-redux.svg
[coverage-url]: https://coveralls.io/r/TrigenSoftware/flexis-redux

[dependabot]: https://api.dependabot.com/badges/status?host=github&repo=TrigenSoftware/flexis-redux
[dependabot-url]: https://dependabot.com/

[documentation]: https://img.shields.io/badge/API-Documentation-2b7489.svg
[documentation-url]: https://trigensoftware.github.io/flexis-redux

Wrapper for [Redux](https://github.com/reactjs/redux).

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
    IStateAdapter,
    DefaultAdapter,
    ImmutableAdapter,
    ImmerAdapter,
    Reducer,
    ActionType,
    CustomDispatcher,
    createAction,
    Provider,
    Connect
};
```

[Description of this methods you can find in Documentation.](https://trigensoftware.github.io/flexis-redux/index.html)
