// Root config, for files outside workspace packages. Packages have their own.
import config from "@tractor/config/eslint";

export default [...config, { ignores: ["apps/**", "packages/**", "e2e/**"] }];
