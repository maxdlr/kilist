import FoodIcon from "@/components/elements/FoodIcon";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

const FoodHero = ({ food }: { food: FoodType }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const [heroSize, setHeroSize] = useState(0);

  return (
    <View
      style={styles.hero}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setHeroSize(
          Math.floor(Math.min(width, height - 2 * skin.spacing.small)),
        );
      }}
    >
      {heroSize > 0 &&
        (food.imageUrl ? (
          <Image
            source={{ uri: food.imageUrl }}
            style={{ height: heroSize, width: heroSize }}
            contentFit="contain"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <FoodIcon name={food.icon} size={heroSize} />
        ))}
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    hero: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      minHeight: 0,
      paddingVertical: s.spacing.small,
    },
  });

export default FoodHero;
