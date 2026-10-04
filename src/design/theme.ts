import { Platform } from "react-native";

export const colors = {
  paper: "#F2EEE5",
  paperDeep: "#E4DCCD",
  ink: "#171714",
  muted: "#6D695F",
  line: "#CFC7B8",
  accent: "#B33D20",
  accentDark: "#84301C",
  moss: "#33483B",
  ochre: "#D7A05A",
  white: "#FFFFFF",
} as const;

export const fonts = {
  display: Platform.select({
    ios: "Iowan Old Style",
    android: "serif",
    default: "Georgia",
  }),
  sans: Platform.select({
    ios: "Arial",
    android: "sans-serif",
    default: "Arial",
  }),
} as const;

export const type = {
  displayHero: { fontSize: 58, lineHeight: 55, letterSpacing: -2.5 },
  displayScreen: { fontSize: 46, lineHeight: 46, letterSpacing: -1.8 },
  displaySection: { fontSize: 34, lineHeight: 36, letterSpacing: -1 },
  title: { fontSize: 24, lineHeight: 28, letterSpacing: -0.4 },
  bodyLarge: { fontSize: 18, lineHeight: 28 },
  body: { fontSize: 16, lineHeight: 24 },
  bodySmall: { fontSize: 14, lineHeight: 20 },
  label: { fontSize: 12, lineHeight: 16, letterSpacing: 1.4 },
  eyebrow: { fontSize: 12, lineHeight: 16, letterSpacing: 2.6 },
} as const;

export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

export const radius = { sm: 6, md: 8, lg: 12, xl: 16, full: 999 } as const;
export const control = {
  minimumTouchTarget: 44,
  standardHeight: 48,
  primaryHeight: 56,
} as const;
