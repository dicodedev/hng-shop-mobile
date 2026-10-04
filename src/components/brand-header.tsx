import { StyleSheet, Text, View } from "react-native";

import { colors, fonts, space, type } from "@/design/theme";

export function BrandHeader() {
  return (
    <View style={styles.header}>
      <Text
        accessibilityRole="header"
        maxFontSizeMultiplier={1.5}
        style={styles.wordmark}
      >
        HNG Shop
      </Text>
      <Text maxFontSizeMultiplier={1.5} style={styles.location}>
        Lagos / Nigeria
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: space[3],
  },
  wordmark: {
    ...type.title,
    color: colors.ink,
    fontFamily: fonts.display,
  },
  location: {
    ...type.label,
    color: colors.muted,
    fontFamily: fonts.sans,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
