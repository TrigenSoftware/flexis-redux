import {
	external
} from '@trigen/scripts-plugin-rollup/helpers';
import tslint from 'rollup-plugin-tslint';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import babel from 'rollup-plugin-babel';
import { DEFAULT_EXTENSIONS } from '@babel/core';
import pkg from './package.json';

function plugins(transpile = true) {
	return [
		tslint({
			exclude:    ['**/*.json', 'node_modules/**'],
			throwError: true
		}),
		commonjs(),
		typescript(),
		transpile && babel({
			extensions: [
				...DEFAULT_EXTENSIONS,
				'ts',
				'tsx'
			],
			runtimeHelpers: true
		})
	].filter(Boolean);
}

export default [{
	input:    'src/index.ts',
	plugins:  plugins(),
	external: external(pkg, true),
	output:   [{
		file:      pkg.main,
		format:    'cjs',
		exports:   'named',
		sourcemap: 'inline'
	}, {
		file:      pkg.module,
		format:    'es',
		sourcemap: 'inline'
	}]
}, {
	input:    'src/index.ts',
	plugins:  plugins(false),
	external: external(pkg, true),
	output:   {
		file:      pkg.raw,
		format:    'es',
		sourcemap: 'inline'
	}
}];
