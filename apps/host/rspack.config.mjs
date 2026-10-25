import { defineAppConfig } from "@tractor/config/rspack";

export default defineAppConfig({
  name: "host",
  dirname: import.meta.dirname,
  host: true,
  remotes: ["explore", "checkout"],
});
