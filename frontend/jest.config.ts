// Keep a .ts config file present, but delegate to the JS config so we don't
// require ts-node just to run Jest.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jsConfig = require("./jest.config.js");

export default jsConfig;
