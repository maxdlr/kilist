import common from "@/i18n/common";
import KilButton from "@/components/elements/KilButton";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import type { Account } from "@/hooks/screens/useAccount";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { caseFor } from "@/skins";
import type { ActionKind, Skin } from "@/skins/types";
import { StyleSheet, View } from "react-native";

const GuestCard = ({
  account,
  ink,
  secondary = "secondaryOnLight",
}: {
  account: Account;
  ink: string;
  secondary?: ActionKind;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.guest;

  return (
    <View style={styles.card}>
      <Title size={skin.type.headline} lines={2} color={ink} header={false}>
        {caseFor(skin, copy.cardTitle)}
      </Title>
      <ThemedText size={skin.type.label} color={ink}>
        {copy.cardLine}
      </ThemedText>
      <View style={styles.actions}>
        <KilButton
          height={skin.size.button.sm}
          fontSize={skin.type.label}
          label={copy.create}
          onTouch={account.createAccount}
        />
        <KilButton
          height={skin.size.button.sm}
          fontSize={skin.type.label}
          variant={secondary}
          label={copy.login}
          onTouch={account.logIn}
        />
        <KilButton
          height={skin.size.button.sm}
          fontSize={skin.type.label}
          variant={secondary}
          label={common.guestRename.action}
          onTouch={account.openGuestName}
        />
      </View>
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    card: { gap: s.spacing.inline },
    actions: { gap: s.spacing.inline },
  });

export default GuestCard;
