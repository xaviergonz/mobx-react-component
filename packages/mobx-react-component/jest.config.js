module.exports = {
    preset: "ts-jest",
    testEnvironment: "jsdom",
    transform: {
        "^.+\\.ts$": ["ts-jest", { tsconfig: `./test/tsconfig.json` }],
    },
}
