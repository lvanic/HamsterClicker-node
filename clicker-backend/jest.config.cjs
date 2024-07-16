module.exports = {
    testEnvironment: "node",
    testMatch: ["**/tests/**/*.[jt]s?(x)"],
    transform: {
        '^.+\\.js$': 'babel-jest',
    },
};