import config from "@tractor/config/eslint";

export default [...config, { ignores: ["*.config.js", "build/**"] }];
