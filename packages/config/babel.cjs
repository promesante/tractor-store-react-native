// Babel config shared by all apps. Re.Pack's babel-swc-loader runs SWC first and Babel
// only for what SWC can't do, and it reads the JSX settings from here.
module.exports = {
  presets: ["module:@react-native/babel-preset"],
  plugins: [
    // NativeWind's JSX runtime turns `className` into React Native styles.
    [
      "@babel/plugin-transform-react-jsx",
      { runtime: "automatic", importSource: "nativewind" },
    ],
    "react-native-worklets/plugin",
  ],
};
