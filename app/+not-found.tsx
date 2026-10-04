import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EditorialState } from "@/components/editorial-state";
import { colors, space } from "@/design/theme";

export default function NotFoundRoute() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.frame}>
        <EditorialState
          actionLabel="Return to shop"
          body="The page you were looking for is not part of this collection."
          eyebrow="Not found"
          onAction={() => router.replace("/")}
          title="Nothing is displayed here."
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  frame: { flex: 1, justifyContent: "center", paddingHorizontal: space[5] },
});
