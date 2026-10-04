import { StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { colors, fonts, space, type } from "@/design/theme";

type EditorialStateProps = {
  eyebrow: string;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EditorialState({
  eyebrow,
  title,
  body,
  actionLabel,
  onAction,
}: EditorialStateProps) {
  return (
    <View accessibilityRole="summary" style={styles.container}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.body}>{body}</Text>
      {actionLabel && onAction ? (
        <PrimaryButton
          label={actionLabel}
          onPress={onAction}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: space[16], alignItems: "flex-start" },
  eyebrow: {
    ...type.eyebrow,
    color: colors.accent,
    fontFamily: fonts.sans,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    ...type.displaySection,
    color: colors.ink,
    fontFamily: fonts.display,
    marginTop: space[4],
    maxWidth: 420,
  },
  body: {
    ...type.body,
    color: colors.muted,
    fontFamily: fonts.sans,
    marginTop: space[4],
    maxWidth: 460,
  },
  action: { marginTop: space[6] },
});
