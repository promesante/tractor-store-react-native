# Task Plan

Tasks for building the store described in [spec.md](./spec.md).

- One task is one pull request, except T0, which is committed directly to `main` as the base.
- Claude opens each PR. The repo owner reviews and merges.
- Every merge leaves `main` buildable. From T4 on, every merge also deploys.
- Branches start from `main`. A task whose dependency is not merged waits for that merge.
- Branch names follow `t<N>-<slug>`, for example `t1-monorepo-scaffold`.

## Status

| Task | Title                                             | Depends on | Status |
| ---- | ------------------------------------------------- | ---------- | ------ |
| T0   | Spec and plan                                     | none       | Done   |
| T1   | Monorepo scaffold and CI                          | T0         | Review |
| T2   | Spike: Re.Pack Module Federation with Gluestack   | T1         | Todo   |
| T3   | Host app: navigation, remote loading, fallbacks   | T2         | Todo   |
| T4   | Cloudflare Workers and deploy workflow            | T3         | Todo   |
| T5   | Shared UI: theme, Button, Boundary toggle         | T3         | Todo   |
| T6   | Assets: images, fonts and data per team           | T4         | Todo   |
| T7   | Explore: screens, header and footer               | T5, T6     | Todo   |
| T8   | Explore widgets: recommendations and store picker | T7         | Todo   |
| T9   | Checkout: cart state, add to cart, mini cart      | T5, T6     | Todo   |
| T10  | Decide: product screen                            | T8, T9     | Todo   |
| T11  | Checkout: cart, checkout and thank-you screens    | T8, T9     | Todo   |
| T12  | End-to-end tests in CI                            | T10, T11   | Todo   |
| T13  | Bonus: Inspire team owns recommendations          | T12        | Todo   |
| T14  | Docs: README, specs table, footer credits         | T12        | Todo   |
| T15  | Submit to the Tractor Store site                  | T14        | Todo   |
| T16  | iOS build                                         | T12        | Todo   |

## Phase 0: Foundation

### T0. Spec and plan

- Expand `spec.md` with the agreed architecture.
- Add this plan.
- Create the public repo `promesante/tractor-store-react-native` and push `main`.

### T1. Monorepo scaffold and CI

- pnpm workspaces and Turborepo with `build`, `dev`, `lint`, `typecheck`, `test` pipelines.
- pnpm configured for React Native: hoisted node linker.
- A workspace catalog that pins exact versions. T2 adds the shared singletons once the spike
  settles their versions.
- `packages/config` with the shared TypeScript and ESLint config. Prettier at the root.
- `.github/workflows/ci.yml` runs lint, typecheck and test on every PR.
- Node pinned with `.nvmrc`, pnpm pinned with `packageManager`, Java 17 noted for Android.
- `packages/events` with the typed event bus and its unit tests, so the pipelines have code to
  check. T2 shares it between host and remotes.
- TypeScript stays on 5.9: typescript-eslint does not support TypeScript 7 yet.

**Done when** `pnpm install`, `pnpm lint`, `pnpm typecheck` and `pnpm test` pass locally and in CI.

### T2. Spike: Re.Pack Module Federation with Gluestack

Proves the open risks in [spec.md, section 11](./spec.md#11-risks) before feature work.

- `apps/host`: a bare React Native app on Re.Pack, at the newest React Native version Re.Pack supports.
- `apps/explore`: a remote exposing one screen with a Gluestack button.
- `apps/checkout`: a remote exposing one widget, embedded in the Explore screen.
- An event published by Explore updates the Checkout widget, through `packages/events`.
- NativeWind classes styled in each remote render correctly.
- Findings written to [docs/spike.md](./docs/spike.md): versions, what worked, what needed
  patching, and any change to the spec.

**Done when** the debug app on the Android emulator loads both remotes from their dev servers,
the event reaches the widget, and a change in a remote shows after a reload without rebuilding the host.

## Phase 1: Platform

### T3. Host app: navigation, remote loading, fallbacks

- Host builds its stack navigator from each remote's exposed screens.
- Loading screen while remotes load. Error with retry per remote.
- `RemoteWidget` wrapper with a fallback, for widgets embedded across teams.
- Remote URLs set per build: local ports for debug, Worker URLs for release.

**Done when** stopping one remote's dev server shows its fallback, and the other remote keeps working.

### T4. Cloudflare Workers and deploy workflow

- A Static Assets Worker per team, each with a public `workers.dev` URL.
- `.github/workflows/deploy.yml` deploys the remotes changed by each push to `main`, and can also
  be run by hand to deploy everything.
- The same workflow builds a release APK pointing at the Workers, and uploads it as an artifact.
- Repo owner adds `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets.

**Done when** the release APK from CI, installed on the emulator, loads the spike remotes from
Cloudflare, and a merged remote change shows in the installed app without a new APK.

### T5. Shared UI: theme, Button, Boundary toggle

- `packages/ui` with the Gluestack provider and theme: blueprint colors and Raleway.
- `Button` covering the blueprint's variants: primary, secondary, rounded, small.
- `Boundary` component: draws a team-colored border when the toggle is on.
- Floating boundary toggle in the host.

**Done when** the Button and Boundary are used by both spike remotes, and the toggle outlines them.

### T6. Assets: images, fonts and data per team

- Copy each team's data from tractor-store-react's `db.json` files.
- Copy the images each team needs from the blueprint's `cdn` folder into that team's Worker assets.
- Raleway bundled in the host.
- Add a `LICENSE`: MIT for this project, keeping neuland's notice for reused data and assets.

**Done when** each Worker serves its own images, and the host renders Raleway.

## Phase 2: Teams

### T7. Explore: screens, header and footer

- Home with teasers, category with filter and price sort, stores.
- Header with navigation and the mini cart slot, and footer, exposed as widgets.
- The home screen's recommendations come with T8.

**Done when** the three Explore screens show all their content, with header and footer.

### T8. Explore widgets: recommendations and store picker

- Recommendations widget taking `skus`, with the blueprint's color-distance algorithm and unit tests.
- Store picker widget as a Gluestack bottom sheet, publishing `explore:store-selected`.
- Home screen shows recommendations.

**Done when** both widgets render inside a host screen, and the algorithm tests pass.

### T9. Checkout: cart state, add to cart, mini cart

- Cart store in AsyncStorage, in the blueprint format.
- Add to cart widget taking `sku`, with stock info and confirmation. Publishes `checkout:cart-updated`.
- Mini cart widget in the header, updating on `checkout:cart-updated`.

**Done when** adding to cart updates the mini cart at once, and the count survives an app restart.

### T10. Decide: product screen

- New `apps/decide` remote and `tractor-decide` Worker.
- Product screen with image, highlights and variant options.
- Embeds header, footer, add to cart and recommendations widgets.
- Variant change updates price, stock and recommendations through props.

**Done when** the product screen shows everything from the sister project, and variant change works.

### T11. Checkout: cart, checkout and thank-you screens

- Cart with line items, remove, total and recommendations.
- Checkout with a compact header, form validation and the store picker widget.
- Place order clears the cart and goes to the thank-you screen with confetti from an external package.

**Done when** the full journey from home to thank-you works on the emulator.

## Phase 3: Quality and bonus

### T12. End-to-end tests in CI

- Maestro flows for the customer journey and each communication concept, in `e2e`.
- Run in CI on an Android emulator against locally served remotes, as a separate job.

**Done when** the suite passes in CI and repeatedly from fresh local starts.

### T13. Bonus: Inspire team owns recommendations

- New `apps/inspire` remote and `tractor-inspire` Worker.
- Move the recommendations widget, its algorithm and data from Explore to Inspire, with Inspire's purple boundary.
- Home, product and cart embed Inspire's widget.

**Done when** recommendations come from Inspire everywhere, and Explore no longer exposes them.

### T14. Docs: README, specs table, footer credits

- README with the specs table, how to run it, and the framework-agnostic limit from spec section 2.2.
- Footer credits naming this stack and linking to the repo.

**Done when** the README lets a newcomer run the store from a fresh clone.

### T15. Submit to the Tractor Store site

- A GitHub Release with the APK, and a short screen recording of the journey.
- Draft the submission email for the repo owner to send.

**Done when** the repo owner has sent the submission.

### T16. iOS build

- Needs Xcode and CocoaPods, locally or on a macOS CI runner.
- Host builds and runs on the iOS simulator, loading the same remotes.

**Done when** the journey works on the iOS simulator.
