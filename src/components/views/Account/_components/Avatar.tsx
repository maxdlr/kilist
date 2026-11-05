import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { StyleSheet, View } from "react-native";

const Avatar = ({ name, size = 32 }: { name: string; size?: number }) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.backgroundSelected,
        },
      ]}
    >
      <ThemedText type="smallBold">{name.charAt(0).toUpperCase()}</ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default Avatar;
