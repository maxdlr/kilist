import common from "@/i18n/common";
import KilButton from "@/components/elements/KilButton";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import GuestCard from "@/components/views/Account/_components/GuestCard";
import AccountPanels from "@/components/views/Account/_components/AccountPanels";
import LooksShowcase from "@/components/views/Account/_components/LooksShowcase";
import useAccount from "@/hooks/screens/useAccount";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { SwipeGameType } from "@/providers/SwipeFoodsProvider";
import type { Skin } from "@/skins/types";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import useSWR from "swr";
import { arcadePalette as P } from "..";
import Ground from "./Ground";
import { ArcadeCard, shadowOf } from "./parts";
import { arcadeText as T } from "./text";

const AVATAR_FILLS = [P.mint, P.pale, P.plank, P.yellow, P.lilac];

const avatarFill = (id: number) => AVATAR_FILLS[Math.abs(id) % AVATAR_FILLS.length]!;

const Avatar = ({
  name,
  id,
  size,
  ring = P.navy,
}: {
  name: string;
  id: number;
  size: number;
  ring?: string;
}) => {
  const skin = useSkin();
  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: avatarFill(id),
        borderColor: ring,
        borderRadius: size,
        borderWidth: skin.shape.border,
        height: size,
        justifyContent: "center",
        width: size,
      }}
    >
      <ThemedText size={size * 0.48} color={P.navy}>
        {name.charAt(0).toUpperCase()}
      </ThemedText>
    </View>
  );
};

const Stat = ({ value, label }: { value: string; label: string }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  return (
    <View style={styles.stat}>
      <ThemedText numberOfLines={1} adjustsFontSizeToFit size={skin.type.body} color={P.white}>
        {value}
      </ThemedText>
      <ThemedText size={skin.type.caption - 3} color={P.softNavy}>
        {label}
      </ThemedText>
    </View>
  );
};

const MenuRow = ({
  label,
  detail,
  onPress,
}: {
  label: string;
  detail?: string;
  onPress: () => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: P.pale }]}
    >
      <ThemedText size={skin.type.body} color={P.navy}>
        {label}
      </ThemedText>
      <ThemedText size={skin.type.caption} color={P.navy}>
        {detail ?? "›"}
      </ThemedText>
    </Pressable>
  );
};

const ArcadeAccount = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.account;
  const account = useAccount();
  const { user, setOpenPanel } = account;
  const tzOffset = useMemo(() => new Date().getTimezoneOffset(), []);
  const { data: game } = useSWR<SwipeGameType>({
    url: "swipe-list/game",
    params: { tzOffset },
  });

  if (!user) return null;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <Ground padded={false} style={styles.ground}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={[styles.player, { boxShadow: shadowOf(skin, 1, P.plankShadow) }]}>
            <View style={styles.playerTop}>
              <Avatar name={user.username} id={user.id} size={skin.size.button.lg} ring={P.white} />
              <View style={styles.flex}>
                <ThemedText size={skin.type.caption - 2} color={P.softNavy}>
                  {T.player}
                </ThemedText>
                <Title size={skin.type.title} lines={1} color={P.white}>
                  {user.username}
                </Title>
                <ThemedText mono numberOfLines={1} size={skin.type.mono - 2} color={P.softNavy}>
                  {user.email}
                </ThemedText>
              </View>
            </View>
            <View style={styles.stats}>
              <Stat value={T.day(game?.level ?? 1)} label={T.streak} />
              <Stat value={String(account.balance)} label={T.ticketsLabel} />
              <Stat value={skin.name} label={T.skin} />
            </View>
          </View>

          <LooksShowcase titleColor={P.white} inset={skin.spacing.section} />

          {account.isGuest ? (
            <ArcadeCard lift={1} style={styles.team}>
              <GuestCard account={account} ink={P.navy} />
            </ArcadeCard>
          ) : (
            <ArcadeCard lift={1} style={styles.team}>
              <ThemedText size={skin.type.caption - 2} color={P.dimInk}>
                {T.team}
              </ThemedText>
              <Title size={skin.type.lead} lines={1} color={P.navy}>
                {account.householdName || T.teamFallback}
              </Title>
              <View style={styles.codeRow}>
                <View style={styles.code}>
                  <ThemedText mono size={skin.type.mono} color={P.navy}>
                    {T.code(account.joinCode)}
                  </ThemedText>
                </View>
                <KilButton
                  height={skin.size.button.xs + 4}
                  fontSize={skin.type.label}
                  label={copy.share}
                  accessibilityLabel={T.shareTeamAria}
                  style={styles.chip}
                  onTouch={account.shareCode}
                />
                <KilButton
                  height={skin.size.button.xs + 4}
                  fontSize={skin.type.label}
                  label={copy.qr}
                  accessibilityLabel={T.qrTeamAria}
                  style={styles.chip}
                  onTouch={() => setOpenPanel("qr")}
                />
              </View>
              <View style={styles.roster}>
                {account.members.map((member) => (
                  <View key={member.id} style={styles.member}>
                    <Avatar name={member.username} id={member.id} size={skin.size.button.xs} />
                    <ThemedText numberOfLines={1} size={skin.type.caption} color={P.navy}>
                      {member.id === user.id ? T.you : member.username}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </ArcadeCard>
          )}

          <View style={styles.menu}>
            {!account.isGuest && <MenuRow label={T.switchTeam} onPress={() => setOpenPanel("switch")} />}
            <MenuRow label={copy.suggested} onPress={account.replayOnboarding} />
            <MenuRow label={common.language} detail={`${account.languageName} ›`} onPress={account.openLanguage} />
            <MenuRow label={copy.credits} onPress={account.openCredits} />
          </View>

          {!account.isGuest && (
          <View style={[styles.menu, styles.danger]}>
            <ThemedText size={skin.type.caption} color={P.white}>
              {copy.dangerTitle}
            </ThemedText>
            <MenuRow label={copy.logout} detail=" " onPress={account.logOut} />
            {!account.isAdmin && (
              <KilButton
                variant="danger"
                height={skin.size.button.sm}
                fontSize={skin.type.label}
                label={T.deletePlayer}
                style={styles.delete}
                onTouch={() => setOpenPanel("delete")}
              />
            )}
          </View>
          )}
        </ScrollView>
      </Ground>
      <AccountPanels account={account} />
    </KeyboardAvoidingView>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: {
      flex: 1,
      minWidth: 0,
    },
    ground: {
      gap: 0,
    },
    scroll: {
      gap: s.spacing.section - 2,
      paddingBottom: s.spacing.stack,
      paddingHorizontal: s.spacing.section,
    },
    player: {
      backgroundColor: P.navy,
      borderColor: P.navy,
      borderRadius: s.shape.radius + s.spacing.tight,
      borderWidth: s.shape.border,
      gap: s.spacing.dock,
      padding: s.spacing.section - 2,
    },
    playerTop: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.dock,
    },
    stats: {
      flexDirection: "row",
      gap: s.spacing.small,
    },
    stat: {
      alignItems: "center",
      backgroundColor: P.deepNavy,
      borderRadius: s.spacing.dock,
      flex: 1,
      padding: s.spacing.small,
    },
    team: {
      gap: s.spacing.inline,
      padding: s.spacing.section - 2,
    },
    codeRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.small,
    },
    code: {
      borderColor: P.navy,
      borderRadius: s.spacing.dock,
      borderStyle: "dashed",
      borderWidth: 2,
      flex: 1,
      minWidth: 0,
      paddingHorizontal: s.spacing.inline,
      paddingVertical: s.spacing.small + 2,
    },
    chip: {
      paddingHorizontal: s.spacing.dock,
    },
    roster: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: s.spacing.dock,
    },
    member: {
      alignItems: "center",
      gap: s.spacing.tight,
      maxWidth: s.size.button.xl + s.spacing.small,
    },
    menu: {
      gap: s.spacing.small + 2,
    },
    menuRow: {
      alignItems: "center",
      backgroundColor: P.white,
      borderColor: P.navy,
      borderRadius: s.shape.radius - 2,
      borderWidth: s.shape.border,
      flexDirection: "row",
      justifyContent: "space-between",
      minHeight: s.size.button.sm + s.spacing.tight + 2,
      paddingHorizontal: s.spacing.section - 2,
    },
    delete: {
      marginTop: s.spacing.tight + 2,
    },
    danger: {
      marginTop: s.spacing.section,
    },
  });

export default ArcadeAccount;
