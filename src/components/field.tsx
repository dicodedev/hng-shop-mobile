import { forwardRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { colors, control, fonts, radius, space, type } from "@/design/theme";

type FieldProps = TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
};

/**
 * Labelled field with an associated error.
 *
 * The label is always rendered above the input; placeholder text is never the
 * only label. Errors are linked to the input so assistive technology reads them
 * with the field rather than as detached text.
 */
export const Field = forwardRef<TextInput, FieldProps>(function Field(
  { label, error, hint, onBlur, onFocus, style, ...inputProps },
  ref,
) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        accessibilityHint={error ?? hint}
        accessibilityLabel={error ? `${label}. Error: ${error}` : label}
        accessibilityState={{ disabled: inputProps.editable === false }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          focused ? styles.inputFocused : null,
          error ? styles.inputError : null,
          inputProps.editable === false ? styles.inputDisabled : null,
          style,
        ]}
        {...inputProps}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
});

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
  input: {
    minHeight: control.standardHeight,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: "transparent",
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    color: colors.ink,
    fontFamily: fonts.sans,
    fontSize: 16,
  },
  inputFocused: { borderColor: colors.ink },
  inputError: { borderColor: colors.accent },
  inputDisabled: { backgroundColor: colors.paperDeep, opacity: 0.6 },
  error: {
    ...type.bodySmall,
    color: colors.accent,
    fontFamily: fonts.sans,
    marginTop: space[2],
  },
});
