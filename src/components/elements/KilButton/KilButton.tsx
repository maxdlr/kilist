import { ThemedText } from "@/components/themed-text";
import { Href, Link } from "expo-router";
import { Image, Pressable } from "react-native";

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
      style={{ ...(style?.label ? style.label : {}) }}
      type="default"
      numberOfLines={1}
    >
      {iconSrc && <Image source={{ uri: iconSrc }} />}
      {label}
    </ThemedText>
  );

  if (onTouch) {
    return (
      <Pressable onPress={onTouch} style={{ ...(style?.container || {}) }}>
        {content}
      </Pressable>
    );
  }

  if (href) {
    return (
      <Link href={href} style={{ ...(style?.container || {}) }}>
        {content}
      </Link>
    );
  }

  return <>{content}</>;
};
export default KilButton;
