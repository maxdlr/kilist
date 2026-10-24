import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { Href, Link } from "expo-router";
import { ReactNode } from "react";
import { Pressable, StyleSheet } from "react-native";

const KilButton = ({
  label,
  onTouch,
  href,
  style,
  Icon,
}: {
  label?: string;
  onTouch?: () => void;
  href?: Href;
  style?: {
    container?: any;
    label?: any;
  };
  Icon?: ReactNode;
}) => {
  const content = (
    <ThemedText
      style={{ ...styles.content, ...(style?.label ? style.label : {}) }}
      type="default"
      numberOfLines={1}
    >
      {Icon}
      {label}
    </ThemedText>
  );

  if (onTouch) {
    return (
      <Pressable
        onPress={onTouch}
        style={{ ...styles.container, ...(style?.container || {}) }}
      >
        {content}
      </Pressable>
    );
  }

  if (href) {
    return (
      <Link
        href={href}
        style={{ ...styles.container, ...(style?.container || {}) }}
      >
        {content}
      </Link>
    );
  }

  return <>{content}</>;
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.six,
    backgroundColor: "#007AFF",
    color: "#FFFFFF",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  },
  content: {
    color: "#FFFFFF",
  },
});
export default KilButton;
