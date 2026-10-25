# The Tractor Store: React Native + Module Federation

A mobile micro frontends implementation of [The Tractor Store 2.0](https://micro-frontends.org/tractor-store/),
built with [React Native](https://reactnative.dev/), [Re.Pack](https://re-pack.dev/) Module Federation
and [Gluestack UI](https://gluestack.io/), in a [Turborepo](https://turbo.build/) monorepo. Team bundles
are hosted on Cloudflare Workers and deployed by GitHub Actions.

The task plan lives in [plan.md](./plan.md).

## 1. Original brief

> Porting into mobile ecommerce Web application implemented in sister project tractor-store-react
> which, in turn, follows the guidelines supplied in the "Micro Frontends Tractor Store" initiative,
> https://micro-frontends.org/tractor-store/
>
> Stack:
>
> - React Native
> - Gluestack UI
>
> Let's begin the project with a conversation in order to plan the whole project, beginning actual
> implementation / coding as that plan is resolved

## 2. Goals

- Reproduce every page, widget and feature of the sister project
  [tractor-store-react](../tractor-store-react/README.md) as an Android app, adapted to mobile idioms.
- Keep Explore, Decide and Checkout as separately built and deployed systems, composed at runtime
  with Module Federation, as the sister project does on the web.
- Ship team changes without a new app release: the installed app loads each team's latest bundle.
- Run the whole store locally with one command and an Android emulator.
- Bonus: a shared Button built on Gluestack, and a fourth "Inspire" system that owns recommendations.
- Get listed as an implementation on the Tractor Store 2.0 site.

### 2.1 Features every implementation must have

| Feature                                                                          | Owner                  | Task      |
| -------------------------------------------------------------------------------- | ---------------------- | --------- |
| Boundary toggle, to show which team owns what                                    | Shell                  | T5        |
| Complete shop: home, category, stores, product detail, cart, checkout, thank-you | All teams              | T7 to T11 |
| Header and footer, the same on every screen except checkout                      | Explore                | T7        |
| Recommendations matched by color, from the selected product and cart contents    | Explore, later Inspire | T8, T13   |
| Shopping cart: add and remove tractors, mini cart updates                        | Checkout               | T9, T11   |
| Checkout form with an embedded store picker owned by Explore                     | Checkout, Explore      | T8, T11   |
| Confirmation confetti, powered by an external dependency                         | Checkout               | T11       |

### 2.2 Principles every implementation must follow

- **Team boundaries.** Explore owns home, product lists, stores and recommendations. Decide owns
  the product screen. Checkout owns cart, checkout and thanks.
- **Independent deployment.** Each team builds and deploys its own remote bundle to its own
  Worker. The host app does not change when a team ships JavaScript changes.
- **Framework-agnostic integration: partly met.** On a phone, every remote runs inside the host's
  single React Native runtime. Teams can't leave React Native, and native modules can only come
  from the host binary. Within those limits, teams choose their own JS libraries and state
  handling. Shared packages are kept small and framework-light: `packages/events` is plain
  TypeScript. This limit is stated in the README.

## 3. Reference implementations

| Reference                 | What we reuse                                                                                       | What we do differently                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `tractor-store-react`     | Team split, Module Federation composition, routes exposed per team, per-team `db.json`, event names | Native screens instead of DOM; Re.Pack instead of webpack; cart persisted on the device |
| `tractor-store-blueprint` | Data, images, fonts, team colors, the color-distance recommendation algorithm                       | Mobile layout instead of the web CSS                                                    |
| `tractor-store-qwik`      | Monorepo tooling, Cloudflare Workers hosting, PR-per-task workflow, spike-first plan                | No server rendering                                                                     |

## 4. Decisions

| Aspect            | Decision                                                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Framework         | React Native 0.88, bare workflow (no Expo), with the versions Re.Pack's own test apps use. See [docs/spike.md](./docs/spike.md). |
| Bundler           | Re.Pack 5.4 with Rspack 1.6.0, replacing Metro                                                                                   |
| Micro frontends   | Module Federation 2 (`@module-federation/enhanced`) through Re.Pack                                                              |
| Application shell | A thin host app: navigation container, remote loading, boundary toggle, providers                                                |
| Integration       | Host loads remotes at runtime. Each remote exposes its screens and widgets.                                                      |
| Navigation        | React Navigation native stack in the host. Each team exports its screen list, like the sister project's routes.                  |
| Communication     | Typed event bus in `packages/events`, plus props from parent to child widget                                                     |
| UI library        | Gluestack UI v3 on NativeWind 4 and Tailwind 3, as shared singletons provided by the host                                        |
| Design system     | Shared Button in `packages/ui`, built on Gluestack                                                                               |
| Cart state        | Owned by Checkout, persisted with AsyncStorage                                                                                   |
| Platforms         | Android first. The code stays cross-platform, and iOS is a later task.                                                           |
| UI fidelity       | Mobile-adapted: same screens, data, images and team colors, in mobile idioms                                                     |
| Monorepo          | Turborepo with pnpm workspaces                                                                                                   |
| Hosting           | Cloudflare Workers with Static Assets, one Worker per team. Cloudflare Pages is in maintenance mode.                             |
| CI/CD             | GitHub Actions: checks on every PR. On merge to `main`, deploy the changed remotes and build the host APK as an artifact.        |

## 5. System boundaries

📱 is a screen, 🧩 is a widget embedded in another team's screen.

- 🔴 **Explore**
  - 📱 Home
  - 📱 Category, all products or one category, with filter and price sort
  - 📱 Stores
  - 🧩 Header, on every screen except checkout
  - 🧩 Footer, at the end of every scrolling screen
  - 🧩 Recommendations, on home, product and cart: moved to Inspire in T13
  - 🧩 Store picker, on the checkout screen, as a bottom sheet
- 🟢 **Decide**
  - 📱 Product, with variant selection
- 🟡 **Checkout**
  - 📱 Cart
  - 📱 Checkout
  - 📱 Thank you
  - 🧩 Mini cart, inside the header
  - 🧩 Add to cart, on the product screen
- 🟣 **Inspire** (bonus, T13)
  - 🧩 Recommendations, taken over from Explore

## 6. Architecture

### 6.1 Deployables

| Deployable      | What it is                                                                  | Where it runs                            |
| --------------- | --------------------------------------------------------------------------- | ---------------------------------------- |
| `apps/host`     | The Android app. Native code, shared libraries, navigation, remote loading. | Installed APK, built in CI               |
| `apps/explore`  | Remote bundle with Explore's screens and widgets, plus its images           | `tractor-explore` Worker, Static Assets  |
| `apps/decide`   | Remote bundle with the product screen                                       | `tractor-decide` Worker, Static Assets   |
| `apps/checkout` | Remote bundle with Checkout's screens and widgets                           | `tractor-checkout` Worker, Static Assets |

Each team Worker serves `mf-manifest.json`, its bundles and its images. It needs a public
`workers.dev` URL, because the app fetches from it directly.

### 6.2 Loading remotes

- The host knows each remote's manifest URL from its build config: `localhost` ports during
  development, reached through `adb reverse`, and the `workers.dev` URLs in release builds.
- On start, the host loads every team's exposed `./screens`, then builds the navigator from them.
  A loading screen shows meanwhile, like the sister project's `Loading`.
- If a remote fails to load, its screens show an error with a retry, and other teams keep working.
- Widgets are loaded the same way and rendered through a small `RemoteWidget` wrapper with a
  fallback, so a missing widget doesn't break the screen around it.

### 6.3 Shared dependencies

Shared as Module Federation singletons, provided eagerly by the host: `react`, `react-native`,
`react-dom`, React Navigation, Reanimated, Gluestack and NativeWind, AsyncStorage,
`packages/events` and `packages/ui`. Versions must match exactly: each app reads them from its
installed packages, which all come from the workspace catalog. A remote can't add native modules,
so any library with native code goes into the host first.

NativeWind and Gluestack are also shared by subpath, for example `react-native-css-interop/`,
because their JSX runtime and style registry are imported through subpaths and must exist once.
`react-dom` is there because React Aria, a Gluestack dependency, imports it even on native.
The list lives in `packages/config/rspack.js`.

### 6.4 Communication

All remotes share one JS runtime, so the sister project's `window` custom events become a typed
event bus.

| Concept                                   | tractor-store-react                  | This implementation                                                                       |
| ----------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------- |
| Parent to child: variant change           | Route param `?sku=`                  | Product screen passes `sku` as a prop to its widgets                                      |
| Sibling: add to cart to mini cart         | `add-to-cart`, `updated-cart` events | `checkout:cart-updated` on the bus. Mini cart rereads the cart.                           |
| Child to parent: store picker to checkout | `selected-shop` event                | `explore:store-selected` on the bus, with the store id                                    |
| Inter-team navigation                     | Links to URLs                        | Navigation by route name. Each team documents its routes and params in `packages/events`. |

### 6.5 State and data

- Each team keeps its own copy of the blueprint data and reads it directly.
- The cart belongs to Checkout and persists in AsyncStorage under a Checkout-owned key, in the
  blueprint format `SKU_QTY|SKU_QTY`. No other team reads it.

### 6.6 Styling and assets

- Gluestack components styled with NativeWind classes. Each remote compiles its own classes
  through Re.Pack's NativeWind plugin and registers them in the shared NativeWind registry. The
  Tailwind content of each app includes `packages/ui`, so shared components' classes are compiled too.
- Team colors and the Raleway font follow the blueprint. Fonts are bundled in the host.
- Product and store images are served by the owning team's Worker. No hotlinking to the blueprint host.
- Boundary toggle: a floating switch in the host. When on, every team root draws a border in its
  team color, through the `Boundary` component in `packages/ui`.

## 7. Repository layout

```
apps/
  host/          Android app shell
  explore/       remote
  decide/        remote
  checkout/      remote
packages/
  events/        typed event bus and route contract
  ui/            Gluestack provider, Button, Boundary
  config/        shared Rspack, TypeScript and ESLint config
e2e/             Maestro flows
docs/            spike findings
```

## 8. Local development

- `pnpm dev` starts the dev server for the host and every remote, each on its own port.
- `pnpm android` installs the debug host on the running emulator, with `adb reverse` for each port.
- Node is pinned in `.nvmrc`, Java 17 is required for Android builds.

## 9. CI/CD

- On every PR: lint, typecheck, unit tests, and a build of the affected apps.
- On merge to `main`: deploy the affected remotes to their Workers, then build a release APK and
  publish it as a workflow artifact.
- End-to-end: Maestro flows on an Android emulator in CI, from T12.

## 10. Workflow

- Repository: public GitHub repo `promesante/tractor-store-react-native`.
- One pull request per task in [plan.md](./plan.md). Claude opens each PR. The repo owner reviews
  and merges.
- Every merge must leave `main` buildable.
- Branches start from `main`. A task whose dependency is not merged waits for that merge.

## 11. Risks

| Risk                                              | Why it matters                                                 | Mitigation                                                                  |
| ------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Re.Pack support for the latest React Native       | Re.Pack can lag behind React Native releases                   | Resolved in the [spike](./docs/spike.md): pinned to Re.Pack's test versions |
| NativeWind and Gluestack inside federated remotes | Styles are compiled per bundle and must work in a remote       | Resolved in the [spike](./docs/spike.md)                                    |
| Singleton version drift                           | A mismatch crashes at runtime                                  | Exact pins from the workspace catalog, checked in CI                        |
| Remote unavailable or slow on a phone network     | Screens wouldn't load                                          | Error fallback with retry per remote. Cached bundles later if needed.       |
| No Xcode on the dev machine                       | iOS can't be built or tested locally                           | Android first; iOS as a later task                                          |
| App store policy on downloaded code               | Stores limit changing an app's purpose through downloaded code | Allowed for this kind of JS update; noted in the README                     |
| Gluestack v5 needs NativeWind 5                   | Re.Pack's NativeWind plugin supports NativeWind 4 only         | Stay on Gluestack v3 until NativeWind 5 is stable and Re.Pack supports it   |

## 12. Publishing to the Tractor Store site

| Step on the site                                            | How this project meets it                                                                |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Base the repository on an existing Tractor Store repository | Based on tractor-store-react and the blueprint's data and assets, credited in the README |
| Implement every feature                                     | Section 2.1, tracked in [plan.md](./plan.md)                                             |
| Describe the implementation and fill out the specs table    | Task T14                                                                                 |
| Submit with a repository link and a demo                    | Task T15. The demo is a downloadable APK from a GitHub Release, plus a screen recording. |
