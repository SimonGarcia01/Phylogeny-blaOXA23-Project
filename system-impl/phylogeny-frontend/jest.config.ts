import type { Config } from 'jest';

const config: Config = {
	testEnvironment: 'jsdom',
	setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
	transform: {
		'^.+\\.(ts|tsx)$': [
			'ts-jest',
			{
				tsconfig: {
					jsx: 'react-jsx',
					esModuleInterop: true,
					moduleResolution: 'node',
				},
			},
		],
	},
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/$1',
		'\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
		'\\.(jpg|jpeg|png|gif|svg|ico|webp)$': '<rootDir>/__mocks__/fileMock.js',
	},
	collectCoverageFrom: [
		'libs/**/*.ts',
		'stores/**/*.ts',
		'services/**/*.ts',
		'components/**/*.tsx',
		'!**/*.d.ts',
		'!**/node_modules/**',
	],
	coverageThreshold: {
		global: {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: 80,
		},
	},
	testMatch: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.test.ts', '**/*.test.tsx'],
};

export default config;
