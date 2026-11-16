import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";

const Circle = ({ done }: { done: boolean }) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  return (
    <View
      style={[
        styles.circle,
        done ? styles.circleDone : { borderColor: C.ring },
      ]}
    >
      {done && (
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
          <Path
            d="M5 12l4 4 10-10"
            stroke={C.onFill}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      )}
      {!done && <View style={{ width: skin.spacing.hair }} />}
    </View>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    circle: {
      alignItems: "center",
      borderRadius: s.size.check,
      borderWidth: 1.5,
      height: s.size.check,
      justifyContent: "center",
      width: s.size.check,
    },
    circleDone: { backgroundColor: C.fill, borderColor: C.fill },
  });

export default Circle;
