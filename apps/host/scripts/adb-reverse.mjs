// Lets the app on an emulator or USB device reach the dev servers on this machine.
import { execFileSync } from "node:child_process";
import { ports } from "@tractor/config/rspack";

for (const port of Object.values(ports)) {
  execFileSync("adb", ["reverse", `tcp:${port}`, `tcp:${port}`], {
    stdio: "inherit",
  });
}
