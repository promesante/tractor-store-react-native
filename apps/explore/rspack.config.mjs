import { defineAppConfig } from "@tractor/config/rspack";

export default defineAppConfig({
  name: "explore",
  dirname: import.meta.dirname,
  exposes: { "./SpikeScreen": "./src/SpikeScreen" },
  remotes: ["checkout"],
});
