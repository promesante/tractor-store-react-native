import { defineAppConfig } from "@tractor/config/rspack";

export default defineAppConfig({
  name: "checkout",
  dirname: import.meta.dirname,
  exposes: { "./SpikeWidget": "./src/SpikeWidget" },
});
