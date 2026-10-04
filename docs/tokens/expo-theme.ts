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

export const semanticColors = {
  background: colors.paper,
  backgroundInset: colors.paperDeep,
  foreground: colors.ink,
  foregroundMuted: colors.muted,
  border: colors.line,
  actionPrimary: colors.ink,
  actionAccent: colors.accent,
  actionAccentPressed: colors.accentDark,
  statusPaid: colors.moss,
  statusFailed: colors.accent,
} as const;

export const fontFamily = {
  display: {
    ios: "Iowan Old Style",
    android: "serif",
    web: "Georgia",
  },
  sans: {
    ios: "Arial",
    android: "sans-serif",
    web: "Arial",
  },
} as const;

export type MobilePlatform = keyof (typeof fontFamily)["display"];

export function selectFontFamily(platform: MobilePlatform) {
  return {
    display: fontFamily.display[platform],
    sans: fontFamily.sans[platform],
  } as const;
}

export const type = {
  displayHero: { fontSize: 64, lineHeight: 58, letterSpacing: -2.8 },
  displayScreen: { fontSize: 48, lineHeight: 46, letterSpacing: -2 },
  displaySection: { fontSize: 34, lineHeight: 36, letterSpacing: -1 },
  displayMetric: { fontSize: 32, lineHeight: 34, letterSpacing: -0.8 },
  title: { fontSize: 24, lineHeight: 28, letterSpacing: -0.4 },
  bodyLarge: { fontSize: 18, lineHeight: 28, letterSpacing: 0 },
  body: { fontSize: 16, lineHeight: 24, letterSpacing: 0 },
  bodySmall: { fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  label: { fontSize: 12, lineHeight: 16, letterSpacing: 1.4 },
  eyebrow: { fontSize: 12, lineHeight: 16, letterSpacing: 2.6 },
  badge: { fontSize: 11, lineHeight: 14, letterSpacing: 1.3 },
} as const;

export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;

export const radius = {
  none: 0,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
} as const;

export const control = {
  minimumTouchTarget: 44,
  standardHeight: 48,
  primaryHeight: 56,
} as const;

export const motion = {
  durationMicro: 120,
  durationControl: 180,
  durationReveal: 240,
  durationImage: 300,
} as const;

export const opacity = {
  disabled: 0.5,
  supportingOnDark: 0.65,
  dividerOnDark: 0.2,
} as const;

export const theme = {
  colors,
  semanticColors,
  fontFamily,
  type,
  space,
  radius,
  control,
  motion,
  opacity,
} as const;

export type HngShopTheme = typeof theme;
