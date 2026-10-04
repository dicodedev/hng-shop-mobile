import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, control, fonts, radius, space, type } from "@/design/theme";

type RegionPickerProps = {
  value: string;
  regions: readonly string[];
  onSelect: (region: string) => void;
  error?: string;
};

/**
 * Region picker.
 *
 * Presented as a horizontally scrolling row of pill options, which keeps the
 * control operable with large text and screen readers. Exact region strings are
 * preserved so the value sent to the API matches the contract exactly.
 */
export function RegionPicker({
  value,
  regions,
  onSelect,
  error,
}: RegionPickerProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>State or FCT</Text>
      <ScrollView
        contentContainerStyle={styles.row}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
      >
        {regions.map((region) => {
          const selected = region === value;
          return (
            <Pressable
              accessibilityLabel={region}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              key={region}
              onPress={() => onSelect(region)}
              style={({ pressed }) => [
                styles.pill,
                selected ? styles.pillSelected : null,
                pressed ? styles.pillPressed : null,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  selected ? styles.pillTextSelected : null,
                ]}
              >
                {region}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: space[5] },
  label: {
    ...type.label,
    color: colors.ink,
    fontFamily: fonts.sans,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: space[2],
  },
  scroll: { marginHorizontal: -space[2] },
  row: {
    gap: space[2],
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  pill: {
    minHeight: control.minimumTouchTarget,
    justifyContent: "center",
    paddingHorizontal: space[4],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pillSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  pillPressed: { borderColor: colors.accent },
  pillText: { ...type.bodySmall, color: colors.ink, fontFamily: fonts.sans },
  pillTextSelected: { color: colors.paper },
  error: {
    ...type.bodySmall,
    color: colors.accent,
    fontFamily: fonts.sans,
    marginTop: space[2],
  },
});
