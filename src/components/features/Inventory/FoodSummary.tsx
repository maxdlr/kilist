import { ThemedText } from "@/components/elements/ThemedText";
import type { SummaryPart } from "@/offline/summary";
import { useSkin } from "@/providers/SkinProvider";

const FoodSummary = ({ parts }: { parts: SummaryPart[] }) => {
  const skin = useSkin();
  const bold = { fontFamily: skin.fonts.body?.bold ?? skin.fonts.display.family };

  return (
    <ThemedText size={skin.type.body} color={skin.panel.ink} accessibilityRole="text">
      {parts.map((part, index) =>
        part.bold ? (
          <ThemedText key={index} size={skin.type.body} color={skin.panel.title} style={bold}>
            {part.text}
          </ThemedText>
        ) : (
          part.text
        ),
      )}
    </ThemedText>
  );
};

export default FoodSummary;
