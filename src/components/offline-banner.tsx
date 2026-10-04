import { useNetInfo } from "@react-native-community/netinfo";
import { StyleSheet, Text, View } from "react-native";

import { colors, fonts, space, type } from "@/design/theme";

export function OfflineBanner() {
  const { isConnected } = useNetInfo();
  if (isConnected !== false) return null;

  return (
    <View accessibilityLiveRegion="polite" style={styles.banner}>
      <Text style={styles.text}>Offline / showing saved collection</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.ochre,
    paddingHorizontal: space[5],
    paddingVertical: space[2],
  },
  text: {
    ...type.label,
    color: colors.ink,
    fontFamily: fonts.sans,
    fontWeight: "700",
    textAlign: "center",
    textTransform: "uppercase",
  },
});
