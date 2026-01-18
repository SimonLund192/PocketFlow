/** @type {import('jest').Config} */
module.exports = {
	testEnvironment: "jsdom",
	setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/$1",
	},
	transform: {
		"^.+\\.(t|j)sx?$": [
			"babel-jest",
			{
				presets: ["next/babel"],
			},
		],
	},
};
