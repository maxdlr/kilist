import type { SkinDisplayFont } from "@/skins/types";

const SAFETY = 1.08;

const measure = (text: string, size: number, font: SkinDisplayFont) =>
  [...text].reduce((sum, char) => sum + font.charWidth(char), 0) *
  size *
  SAFETY;

const countLines = (
  words: string[],
  size: number,
  width: number,
  font: SkinDisplayFont,
) => {
  const space = font.charWidth(" ") * size * SAFETY;
  let lines = 1;
  let current = 0;

  for (const word of words) {
    const wordWidth = measure(word, size, font);
    if (current === 0) {
      current = wordWidth;
    } else if (current + space + wordWidth <= width) {
      current += space + wordWidth;
    } else {
      lines += 1;
      current = wordWidth;
    }
  }

  return lines;
};

export const fitFontSize = ({
  text,
  width,
  maxSize,
  minSize,
  maxLines,
  font,
}: {
  text: string;
  width: number;
  maxSize: number;
  minSize: number;
  maxLines: number;
  font: SkinDisplayFont;
}) => {
  const words = text.split(/[ \t\n]+/).filter(Boolean);
  if (!words.length || width <= 0) return maxSize;

  for (let size = maxSize; size > minSize; size -= 2) {
    const longest = Math.max(...words.map((word) => measure(word, size, font)));
    if (longest <= width && countLines(words, size, width, font) <= maxLines) {
      return size;
    }
  }

  return minSize;
};
