const { nativewindTheme } = require("./src/tokens/nativewindTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "media",
  theme: {
    spacing: nativewindTheme.spacing,
    borderRadius: nativewindTheme.borderRadius,
    borderWidth: nativewindTheme.borderWidth,
    fontSize: nativewindTheme.fontSize,
    fontWeight: nativewindTheme.fontWeight,
    boxShadow: nativewindTheme.boxShadow,
    zIndex: nativewindTheme.zIndex,
    extend: {
      colors: nativewindTheme.colors,
      minHeight: nativewindTheme.minHeight,
      height: nativewindTheme.height,
      width: nativewindTheme.width,
      size: nativewindTheme.size,
      opacity: nativewindTheme.opacity,
      transitionDuration: nativewindTheme.transitionDuration,
      transitionTimingFunction: nativewindTheme.transitionTimingFunction,
    },
  },
  plugins: [],
};
