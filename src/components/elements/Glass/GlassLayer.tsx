import type { GlassTarget } from "@/providers/TabBarProvider";
import { Platform, StyleSheet, View } from "react-native";
import GlassBlur from "./GlassBlur";
import type { GlassSettings } from "./glassSettings";

const GlassLayer = ({
  target,
  settings,
  veil,
  backing,
}: {
  target: GlassTarget;
  settings: GlassSettings;
  veil: string;
  backing?: string;
}) => (
  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    {backing && Platform.OS === "android" && (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: backing }]} />
    )}
    <GlassBlur target={target} settings={settings} />
    <View style={[StyleSheet.absoluteFill, { backgroundColor: veil, opacity: settings.veil }]} />
  </View>
);

export default GlassLayer;
