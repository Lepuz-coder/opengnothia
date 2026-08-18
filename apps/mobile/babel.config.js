module.exports = function (api) {
  api.cache(true);
  return {
    // jsxImportSource routes every JSX element through NativeWind's runtime so
    // `className` works on core components. babel-preset-expo adds the
    // react-native-worklets plugin on its own (Reanimated 4).
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
  };
};
