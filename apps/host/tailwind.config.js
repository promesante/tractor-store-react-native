/** @type {import('tailwindcss').Config} */
module.exports = {
  // Shared components are compiled into each bundle's styles, so their sources are scanned too.
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  presets: [require("@tractor/ui/tailwind-preset")],
};
