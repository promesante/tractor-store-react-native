# Spike: Re.Pack Module Federation with Gluestack

Task T2 in [plan.md](../plan.md). It checks the two main risks in
[spec.md, section 11](../spec.md#11-risks) before feature work: runtime Module Federation in
React Native, and Gluestack styling inside federated remotes.

## Result

All checks passed on an Android emulator (API 31, x86_64) with debug builds:

| Check                                                                 | Result |
| --------------------------------------------------------------------- | ------ |
| Host loads a screen from the Explore remote at runtime                | Passed |
| The Explore screen embeds a widget from the Checkout remote, nested   | Passed |
| An event published by Explore reaches the Checkout widget             | Passed |
| A Gluestack button from `packages/ui` renders styled inside a remote  | Passed |
| NativeWind classes written in each remote render                      | Passed |
| A change in a remote shows after relaunching, without rebuilding host | Passed |

In the spike, the Explore screen has a red border, the Checkout widget a yellow one, and the
button publishes `explore:store-selected`, which the widget displays.

## Versions

React Native, Rspack and Module Federation follow
[Re.Pack's own test apps](https://github.com/callstack/repack/blob/main/pnpm-workspace.yaml),
the combination Re.Pack is tested with. All versions are pinned exactly in
[pnpm-workspace.yaml](../pnpm-workspace.yaml).

| Package                     | Version | Why                                                                |
| --------------------------- | ------- | ------------------------------------------------------------------ |
| react-native                | 0.88.0  | Latest, and what Re.Pack tests                                     |
| react, react-dom            | 19.3.0  | Matches React Native 0.88                                          |
| @callstack/repack           | 5.4.2   | Latest                                                             |
| @rspack/core                | 1.6.0   | Re.Pack pins it: 1.6.2+ breaks Module Federation v2 polyfill order |
| @module-federation/enhanced | 2.9.2   | Re.Pack's tested version                                           |
| react-native-reanimated     | 4.7.1   | Supports React Native 0.86 to 0.88. NativeWind needs it.           |
| nativewind                  | 4.2.7   | Latest stable. NativeWind 5 is a release candidate.                |
| tailwindcss                 | 3.4.19  | NativeWind 4 needs Tailwind 3                                      |
| @gluestack-ui/core          | 3.0.25  | Gluestack v3 is the line built for NativeWind 4                    |
| typescript                  | 5.9.3   | typescript-eslint does not support TypeScript 7 yet                |

## Findings

1. **Gluestack v5 doesn't fit yet.** It expects NativeWind 5 (Tailwind 4) or UniWind. UniWind
   needs Metro, and Re.Pack's NativeWind plugin supports NativeWind 4. Gluestack v3 works.
   Its components are copied from the `main-v3` branch of gluestack-ui into
   `packages/ui/src/gluestack`, which is what `npx gluestack-ui@3 add` would copy.
2. **Gluestack's Tailwind template breaks native styles.** It sets `important: 'html'`, which
   scopes every class under `html`. NativeWind drops such selectors on native, so no class
   applied. Removed from the preset.
3. **NativeWind's JSX runtime is set in Babel, not by the plugin.** Re.Pack's NativeWind plugin
   only rewrites `builtin:swc-loader` rules. With `babel-swc-loader`, the JSX import source comes
   from the Babel config: `@babel/plugin-transform-react-jsx` with `importSource: "nativewind"`,
   in `packages/config/babel.cjs`. Without it, `className` is silently ignored.
4. **Subpath imports must be shared too.** NativeWind's JSX runtime and style registry are
   imported as `nativewind/...` and `react-native-css-interop/...`. Sharing only the package root
   would give each bundle its own registry. They're shared with trailing-slash keys, such as
   `react-native-css-interop/`, which Module Federation applies to every subpath.
5. **React Aria imports `react-dom` on native.** Gluestack depends on React Aria, which imports
   `react-dom` for `flushSync`. React 19's `react-dom` entry is small and doesn't include the DOM
   renderer, so it's installed and shared as a singleton.
6. **A remote can load another remote.** Explore declares Checkout as its own remote, and the
   host's Module Federation runtime resolves it. Discovery for real builds comes in T3 and T4.
7. **The monorepo needs a few adjustments for React Native.**
   - pnpm's hoisted node linker, because Gradle and Re.Pack expect a flat `node_modules`.
   - `autoInstallPeers: false`, so web-only peers such as `react-native-web` stay out. Missing
     web-only peers are listed in `peerDependencyRules.ignoreMissing`.
   - The host's Gradle files point at the repo root's `node_modules`.
   - Remotes have no native folders. They are only JS bundles built by Re.Pack's dev server or
     `bundle` command.
8. **One harmless build warning.** Reanimated's Jest helpers use a dynamic `require`, which
   Rspack reports as a critical dependency. It never runs outside Jest.
9. **Emulator resources matter.** The first native build took 21 minutes. An AVD with 15.5 GB
   of RAM on a 16 GB machine made the emulator unusable. Starting it with `-memory 4096` fixed it.

## Spec changes

- Decisions table: React Native 0.88, Rspack 1.6.0, Gluestack v3 on NativeWind 4.
- Section 6.3: `react-dom`, Reanimated and subpath sharing added.
- Section 11: the first two risks are resolved. A new one covers the Gluestack v5 and
  NativeWind 5 dependency.

## Left for later tasks

- Building the navigator from each remote's exposed screens, and fallbacks per remote: T3.
- Remote URLs for release builds, and the release bundle command in Gradle: T3 and T4.
- The Re.Pack and Reanimated warnings could be silenced in the shared config if they get noisy.
