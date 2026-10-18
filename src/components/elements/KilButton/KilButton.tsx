import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { Href, Link } from "expo-router";
import { Image, Pressable, StyleSheet } from "react-native";

const KilButton = ({
  label,
  onTouch,
  iconSrc,
  href,
  style,
}: {
  label?: string;
  onTouch?: () => void;
  iconSrc?: string;
  href?: Href;
  style?: {
    container?: any;
    label?: any;
  };
}) => {
  const content = (
    <ThemedText
      style={{ ...(style?.label ? style.label : {}), ...styles.content }}
      type="default"
      numberOfLines={1}
    >
      {iconSrc && <Image source={{ uri: iconSrc }} />}
      {label}
    </ThemedText>
  );

  if (onTouch) {
    return (
      <Pressable
        onPress={onTouch}
        style={{ ...(style?.container || {}), ...styles.container }}
      >
        {content}
      </Pressable>
    );
  }

  if (href) {
    return (
      <Link
        href={href}
        style={{ ...(style?.container || {}), ...styles.container }}
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
