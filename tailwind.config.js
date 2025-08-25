// tailwind.config.js
import { getTailwindColors } from "./src/Calendar/dates.js";

function buildSafelist() {
  const { tags, gradations, colors } = getTailwindColors();

  const shades = colors.filter(
    (c) => !["black", "white", "transparent", "current"].includes(c.name)
  );
  const plain = colors.filter((c) =>
    ["black", "white", "transparent", "current"].includes(c.name)
  );

  const safelist = [];

  for (const { name } of shades) {
    for (const g of gradations) {
      for (const tag of tags) {
        safelist.push(`${tag}-${name}-${g}`);
      }
    }
  }

  for (const { name } of plain) {
    for (const tag of tags) {
      safelist.push(`${tag}-${name}`);
    }
  }

  return safelist;
}

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue,svelte,astro,html}",
  ],
  safelist: buildSafelist(),
  theme: {
    extend: {},
  },
  plugins: [],
};
