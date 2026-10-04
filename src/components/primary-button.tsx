import { Pressable, StyleSheet, Text, type PressableProps } from "react-native";

import { colors, control, fonts, radius, space, type } from "@/design/theme";

type PrimaryButtonProps = PressableProps & { label: string };

export function PrimaryButton({
  label,
  disabled,
  style,
  ...props
}: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      style={(state) => [
        styles.button,
        state.pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        typeof style === "function" ? style(state) : style,
      ]}
      {...props}
    >
      <Text maxFontSizeMultiplier={1.8} style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: control.standardHeight,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.ink,
    paddingHorizontal: space[6],
    paddingVertical: space[3],
  },
  pressed: { backgroundColor: colors.accentDark },
  disabled: { opacity: 0.5 },
  label: {
    ...type.label,
    color: colors.paper,
    fontFamily: fonts.sans,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
