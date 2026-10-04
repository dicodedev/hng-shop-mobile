import { StyleSheet, View } from "react-native";

import { colors, radius, space } from "@/design/theme";

export function CatalogueSkeleton() {
  return (
    <View
      accessibilityLabel="Loading the HNG Shop collection"
      accessibilityRole="progressbar"
      style={styles.container}
    >
      <View style={[styles.block, styles.eyebrow]} />
      <View style={[styles.block, styles.heading]} />
      <View style={styles.grid}>
        <View style={[styles.block, styles.product]} />
        <View style={[styles.block, styles.product]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: space[8] },
  block: { backgroundColor: colors.paperDeep, borderRadius: radius.sm },
  eyebrow: { width: 110, height: 12 },
  heading: {
    width: "82%",
    height: 100,
    marginTop: space[5],
    borderRadius: radius.lg,
  },
  grid: { flexDirection: "row", gap: space[4], marginTop: space[12] },
  product: { flex: 1, aspectRatio: 0.8, borderRadius: radius.xl },
});
