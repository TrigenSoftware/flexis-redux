import globals from 'rollup-plugin-node-globals';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import typescript from 'rollup-plugin-typescript2';
import tslint from 'rollup-plugin-tslint';
import pkg from './package.json';

const plugins = [
	tslint({
		exclude:    ['**/*.json', 'node_modules/**'],
		throwError: process.env.ROLLUP_WATCH != 'true'
	}),
	commonjs(),
	typescript(),
	babel({
		runtimeHelpers: true
	}),
	resolve({
		browser:        true,
		preferBuiltins: false
	}),
	globals()
];
const dependencies = [].concat(
	Object.keys(pkg.dependencies),
	Object.keys(pkg.peerDependencies)
);

function external(id) {
	return dependencies.some(_ =>
		_ == id || id.indexOf(`${_}/`) == 0
	);
}

export default [{
	input:  'src/index.ts',
	plugins,
	external,
	output: [{
		file:      pkg.main,
		format:    'cjs',
		exports:   'named',
		sourcemap: 'inline'
	}, {
		file:      pkg.module,
		format:    'es',
		sourcemap: 'inline'
	}]
}];
