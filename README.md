# @flexis/redux

[![NPM version][npm]][npm-url]
[![Dependency status][deps]][deps-url]
[![Build status][build]][build-url]
[![Coverage status][coverage]][coverage-url]

[npm]: https://img.shields.io/npm/v/%40flexis/redux.svg
[npm-url]: https://npmjs.com/package/@flexis/redux

[deps]: https://david-dm.org/TrigenSoftware/flexis-redux.svg
[deps-url]: https://david-dm.org/TrigenSoftware/flexis-redux

[build]: http://img.shields.io/travis/TrigenSoftware/flexis-redux.svg
[build-url]: https://travis-ci.org/TrigenSoftware/flexis-redux

[coverage]: https://img.shields.io/coveralls/TrigenSoftware/flexis-redux.svg
[coverage-url]: https://coveralls.io/r/TrigenSoftware/flexis-redux

Wrapper for [Redux](https://github.com/reactjs/redux), based on [ImmutableJS](https://github.com/facebook/immutable-js/).

## Install

```sh
npm i -S @flexis/redux
# or
yarn add @flexis/redux
```

## API

- `class Store(actions: Object<string, Actions>|Actions)`
    - `destroy(): void`
    - `subscribe(listener: (state: Immutable.Collection) => void): () => void`
    - `get state(): Immutable.Collection`
    - `get actions(): Object<string, Object<string, Function>|Function>`
- `class Actions(store: Store, namespace?: string)`
- `<Provider store={store: Store}>{children}</Provder>`
- `@Connect(mapStateToProps, mapActionsToProps, mergeProps, { withRef: bool } = { withRef: false })`

---
[![NPM](https://nodeico.herokuapp.com/@flexis/redux.svg)](https://npmjs.com/package/@flexis/redux)
