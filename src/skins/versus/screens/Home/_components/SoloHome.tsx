import V from "@/skins/versus/text";
import { mmss, seconds, useVersusMe } from "@/skins/versus/hooks/api";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { StyleSheet, View } from "react-native";
import { versusPalette as P } from "@/skins/versus/theme/palette";
import { Avatar, Card, VButton, VText } from "@/skins/versus/components";

const SoloHome = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const { data: me } = useVersusMe();
  const personal = me?.personal;
  const stats = [
    { value: seconds(personal?.bestRaceMs), label: V.home.bestRace },
    { value: mmss(personal?.bestShopMs), label: V.home.bestShop },
    { value: V.home.days(personal?.streak ?? 0), label: V.home.streak },
    { value: personal?.changedMindPct === null || personal?.changedMindPct === undefined ? "–" : `${personal.changedMindPct}%`, label: V.home.changedMind },
  ];

  return (
    <>
      <Card>
        <View style={styles.soloRow}>
          <View style={styles.ghostPair}>
            <Avatar name={V.you} color={P.you} size={skin.size.button.sm} />
            <View style={styles.ghostShift}>
              <Avatar name={V.you} color={P.you} size={skin.size.button.sm} ghost />
            </View>
          </View>
          <View style={styles.flex}>
            <VText face="bold" size={skin.type.lead}>{V.youVsBest}</VText>
            <VText size={skin.type.caption} color={P.muted}>
              {personal?.bestRaceMs ? V.home.timeToBeat(seconds(personal.bestRaceMs)) : V.home.playOnce}
            </VText>
          </View>
        </View>
      </Card>
      <View style={styles.section}>
        <VText face="bold" size={skin.type.lead}>{V.home.personalBests}</VText>
        <View style={styles.grid}>
          {stats.map((stat) => (
            <Card key={stat.label} style={styles.gridCell}>
              <VText face="pixel" size={(skin.type.caption - 1)}>{stat.value}</VText>
              <VText size={skin.type.caption} color={P.muted}>{stat.label}</VText>
            </Card>
          ))}
        </View>
      </View>
      <Card dashed line={P.line} style={styles.invite}>
        <VText size={skin.type.caption} color={P.soft} style={styles.flex}>
          {V.home.inviteLine}
        </VText>
        <VButton variant="ghost" label={V.home.invite} href="/account" />
      </Card>
    </>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    section: { gap: s.spacing.inline },
    soloRow: { alignItems: "center", flexDirection: "row", gap: s.spacing.dock - 2 },
    ghostPair: { flexDirection: "row" },
    ghostShift: { marginLeft: -14 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: s.spacing.inline },
    gridCell: { flexBasis: "47%", flexGrow: 1, gap: s.spacing.tight + 2 },
    invite: { alignItems: "center", flexDirection: "row" },
  });

export default SoloHome;
