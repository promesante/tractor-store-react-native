// Shared Re.Pack config for the host and every team remote. Each app calls
// `defineAppConfig` from its own rspack.config.mjs.
import fs from "node:fs";
import path from "node:path";
import * as Repack from "@callstack/repack";
import { NativeWindPlugin } from "@callstack/repack-plugin-nativewind";
import { ReanimatedPlugin } from "@callstack/repack-plugin-reanimated";
import rspack from "@rspack/core";

/** Dev server port of each app. Debug builds load remotes from these ports. */
export const ports = { host: 8081, explore: 8082, checkout: 8083 };

/**
 * Shared as Module Federation singletons. The host provides them eagerly, remotes take
 * the host's copy. Anything with native code must be here, because only the host binary
 * contains native code.
 */
const sharedPackages = [
  "react",
  "react-native",
  "react-dom",
  "@react-navigation/native",
  "@react-navigation/native-stack",
  "react-native-safe-area-context",
  "react-native-screens",
  "react-native-reanimated",
  "react-native-worklets",
  "react-native-svg",
  "nativewind",
  "react-native-css-interop",
  "@gluestack-ui/core",
  "@gluestack-ui/utils",
  "@tractor/events",
  "@tractor/ui",
];

/**
 * Packages imported through subpaths, such as `react-native-css-interop/jsx-runtime`.
 * Sharing only the package root would leave each bundle with its own copy of the
 * subpath modules. NativeWind's style registry, for one, must exist once.
 */
const sharedSubpaths = [
  "nativewind",
  "react-native-css-interop",
  "@gluestack-ui/core",
  "@gluestack-ui/utils",
];

// Looks through node_modules folders from the app's directory up, the way Node resolves
// packages. Reads package.json from disk because some packages don't export it.
function installedVersion(name, dirname) {
  for (let dir = dirname; ; dir = path.dirname(dir)) {
    const file = path.join(dir, "node_modules", name, "package.json");
    if (fs.existsSync(file))
      return JSON.parse(fs.readFileSync(file, "utf8")).version;
    if (dir === path.dirname(dir)) throw new Error(`${name} is not installed`);
  }
}

function shared(eager, dirname) {
  const config = (name) => {
    const version = installedVersion(name, dirname);
    return { singleton: true, eager, version, requiredVersion: version };
  };
  return Object.fromEntries([
    ...sharedPackages.map((name) => [name, config(name)]),
    ...sharedSubpaths.map((name) => [`${name}/`, config(name)]),
  ]);
}

/**
 * @param {object} options
 * @param {string} options.name Module Federation container name, a valid JS identifier.
 * @param {string} options.dirname The app's directory.
 * @param {boolean} [options.host] True for the host app.
 * @param {Record<string, string>} [options.exposes] Modules a remote exposes.
 * @param {Array<keyof typeof ports>} [options.remotes] Remotes this app loads.
 */
export function defineAppConfig({
  name,
  dirname,
  host = false,
  exposes,
  remotes = [],
}) {
  return Repack.defineRspackConfig((env) => {
    const { mode, platform } = env;
    return {
      mode,
      context: dirname,
      entry: "./src/index.ts",
      resolve: {
        ...Repack.getResolveOptions({ enablePackageExports: true }),
      },
      output: {
        path: "[context]/build/[platform]",
        uniqueName: `tractor-${name}`,
      },
      module: {
        rules: [
          {
            test: /\.[cm]?[jt]sx?$/,
            use: {
              loader: "@callstack/repack/babel-swc-loader",
              parallel: true,
              options: {},
            },
            type: "javascript/auto",
          },
          ...Repack.getAssetTransformRules({ inline: !host }),
        ],
      },
      plugins: [
        new Repack.RepackPlugin({
          extraChunks: [
            {
              include: /.*/,
              type: "remote",
              outputPath: `build/${platform}/remote`,
            },
          ],
        }),
        new Repack.plugins.ModuleFederationPluginV2({
          name,
          filename: `${name}.container.js.bundle`,
          exposes,
          remotes: Object.fromEntries(
            remotes.map((remote) => [
              remote,
              `${remote}@http://localhost:${ports[remote]}/${platform}/mf-manifest.json`,
            ]),
          ),
          dts: false,
          shared: shared(host, dirname),
        }),
        new ReanimatedPlugin({ unstable_disableTransform: true }),
        new NativeWindPlugin(),
        // Optional peer of @react-navigation/elements, not installed.
        new rspack.IgnorePlugin({
          resourceRegExp: /^@react-native-masked-view/,
        }),
      ],
    };
  });
}
