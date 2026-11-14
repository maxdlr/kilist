import Press from "@/components/elements/Press";
import useHomeLinks from "@/hooks/screens/useHomeLinks";
import common from "@/i18n/common";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import type { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { EnvelopeIcon, UserPlusIcon } from "react-native-heroicons/outline";
import Svg, { Circle, Path } from "react-native-svg";

const SIZE = 46;
const ICON = 23;

const GEAR =
  "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z";
const LIST = "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01";
const PLUS = "M12 5v14M5 12h14";
const SHIELD = "M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z";

const HomeShortcuts = ({
  ink,
  fill,
  style,
  withNotice = false,
}: {
  ink?: string;
  fill?: string;
  style?: StyleProp<ViewStyle>;
  withNotice?: boolean;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const links = useHomeLinks();
  const color = ink ?? skin.colors.onGround;

  const drawn = (path: string, dot = false) => (
    <Svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d={path} />
      {dot && <Circle cx={12} cy={12} r={3} />}
    </Svg>
  );
  const notice = withNotice ? links.notice : null;
  const NoticeIcon = links.isGuest ? UserPlusIcon : EnvelopeIcon;

  const items: { label: string; open: () => void; icon: ReactNode }[] = [
    ...(notice ? [{ label: notice.label, open: notice.open, icon: <NoticeIcon size={ICON} color={color} strokeWidth={1.8} /> }] : []),
    { label: common.shop.add, open: links.openAdd, icon: drawn(PLUS) },
    { label: skin.copy.tabs.inventory, open: links.openInventory, icon: drawn(LIST) },
    { label: skin.copy.tabs.account, open: links.openAccount, icon: drawn(GEAR, true) },
    ...(links.isAdmin ? [{ label: common.home.admin, open: links.openAdmin, icon: drawn(SHIELD) }] : []),
  ];

  return (
    <View style={[styles.row, style]}>
      {items.map((item) => (
        <Press
          key={item.label}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          hitSlop={4}
          onPress={item.open}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: fill ?? skin.colors.raised, opacity: pressed ? skin.shape.pressedOpacity : 1 },
          ]}
        >
          {item.icon}
        </Press>
      ))}
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    row: { flexDirection: "row", gap: s.spacing.small },
    button: {
      alignItems: "center",
      borderRadius: SIZE / 2,
      height: SIZE,
      justifyContent: "center",
      width: SIZE,
    },
  });

export default HomeShortcuts;
