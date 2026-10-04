import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandHeader } from "@/components/brand-header";
import { EditorialState } from "@/components/editorial-state";
import { colors, space } from "@/design/theme";

export function ComingSoonScreen({
  section,
}: {
  section: "Cart" | "Orders" | "Account";
}) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.frame}>
        <BrandHeader />
        <EditorialState
          body="This customer journey is planned for the next implementation milestone."
          eyebrow="Coming next"
          title={`${section}, thoughtfully connected.`}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  frame: { flex: 1, paddingHorizontal: space[5] },
});
