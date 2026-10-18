import { hsvToColor } from "react-native-reanimated/lib/typescript/Colors";

export const transparentColor = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

type HSL = { h: number; s: number; l: number };

const hexToHsl = (hex: string): HSL => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l };
  }

  const delta = max - min;
  const s = delta / (1 - Math.abs(2 * l - 1));

  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / delta) % 6;
      break;
    case g:
      h = (b - r) / delta + 2;
      break;
    default:
      h = (r - g) / delta + 4;
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;

  return { h, s, l };
};

const hslToHex = ({ h, s, l }: HSL): string => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    [r, g, b] = [c, x, 0];
  } else if (h < 120) {
    [r, g, b] = [x, c, 0];
  } else if (h < 180) {
    [r, g, b] = [0, c, x];
  } else if (h < 240) {
    [r, g, b] = [0, x, c];
  } else if (h < 300) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }

  const toHex = (channel: number) =>
    Math.round((channel + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export type ColorsStep = 5 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
export type ColorScale = Record<ColorsStep, string>;

/**
 * Generates a Tailwind-style 50-900 shade scale from a single base color,
 * using HSL lightness steps rather than opacity — each step is a genuinely
 * lighter or darker color, not a transparent overlay.
 *
 * @param hex - Base color in `#rrggbb` form, treated as the 500 shade
 * @returns A map of shade keys (5-100) to hex color strings
 */
export const generateColorVariants = (hex: string): ColorScale => {
  const { h, s, l } = hexToHsl(hex);

  // Interpolate lightness relative to the base color's own lightness so the
  // ramp stays monotonic (lighter shades always lighter, darker always
  // darker) regardless of how light or dark the base color already is.
  const lightnessSteps: Record<ColorsStep, number> = {
    5: l + (1 - l) * 0.9,
    10: l + (1 - l) * 0.75,
    20: l + (1 - l) * 0.55,
    30: l + (1 - l) * 0.35,
    40: l + (1 - l) * 0.15,
    50: l,
    60: l * 0.85,
    70: l * 0.65,
    80: l * 0.45,
    90: l * 0.25,
    100: l * 0.15,
  };

  return Object.fromEntries(
    Object.entries(lightnessSteps).map(([shade, targetL]) => [
      Number(shade),
      hslToHex({ h, s, l: targetL }),
    ]),
  ) as ColorScale;
};
