import { useContext } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollViewProps } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { PanelScrollContext } from "./panelScroll";

const PanelScrollView = ({ onScroll, ...props }: ScrollViewProps) => {
  const panel = useContext(PanelScrollContext);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    panel?.scrollY.set(event.nativeEvent.contentOffset.y);
    onScroll?.(event);
  };

  return (
    <ScrollView
      {...props}
      bounces={false}
      overScrollMode="never"
      scrollEventThrottle={16}
      onScroll={handleScroll}
      {...(panel && { simultaneousWith: panel.pan as never })}
    />
  );
};

export default PanelScrollView;
