import globals from 'rollup-plugin-node-globals';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import eslint from 'rollup-plugin-eslint';
import pkg from './package.json';

const plugins = [
	eslint({
		exclude:      ['**/*.json', 'node_modules/**'],
		throwOnError: process.env.ROLLUP_WATCH != 'true'
	}),
	babel(Object.assign({
		runtimeHelpers: true,
		babelrc:        false,
		exclude:        'node_modules/**'
	}, pkg.babel, {
		presets: pkg.babel.presets.map((preset) => {

			if (Array.isArray(preset) && preset[0] == 'env') {
				preset[1].modules = false;
			}

			return preset;
		})
	})),
	resolve({
		browser:        true,
		preferBuiltins: false
	}),
	commonjs(),
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
	input:  'src/index.js',
	plugins,
	external,
	output: [{
		file:      pkg.main,
		format:    'cjs',
		exports:   'named',
		sourcemap: true
	}, {
		file:      pkg.module,
		format:    'es',
		sourcemap: true
	}]
}];
