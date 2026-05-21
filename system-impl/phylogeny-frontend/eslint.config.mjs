import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

/**
 * ESLint config for this Next.js project.
 * - Keep Next's recommended configs
 * - Extend Prettier to avoid conflicts between ESLint and Prettier formatting rules
 */
const eslintConfig = defineConfig([
	...nextVitals,
	...nextTs,
	// Integrate Prettier (flat config) to avoid formatting rule conflicts.
	prettier,
	{
		rules: {
			// Keep console usage visible but non-fatal
			'no-console': ['warn', { allow: ['warn', 'error'] }],
			// Allow unused vars that start with underscore (useful for ignored args)
			'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
		},
	},
	// Override default ignores of eslint-config-next.
	globalIgnores([
		// Default ignores of eslint-config-next:
		'.next/**',
		'out/**',
		'build/**',
		'next-env.d.ts',
		// Common ignores
		'node_modules/**',
		'dist/**',
	]),
]);

export default eslintConfig;
