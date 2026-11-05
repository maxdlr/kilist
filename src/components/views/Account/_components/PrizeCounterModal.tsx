import BottomPanel from "@/components/elements/BottomPanel";
import KilButton from "@/components/elements/KilButton";
import Title from "@/components/elements/Title/Title";
import PremiumGate from "@/components/PremiumGate";
import { ThemedText } from "@/components/themed-text";
import { useSkinStyles, useSkinSwitch } from "@/providers/SkinProvider";
import useTickets, { PrizeType } from "@/providers/TicketsProvider";
import useToast from "@/providers/ToastProvider";
import { findSkin, SKINS } from "@/skins";
import type { LevelNumber, Skin } from "@/skins/types";
import { ScrollView, StyleSheet, View } from "react-native";

const LEVELS: LevelNumber[] = [1, 2, 3, 4, 5];

const PrizeRow = ({
  prize,
  balance,
  onWear,
  onRedeem,
}: {
  prize: PrizeType;
  balance: number;
  onWear: () => void;
  onRedeem: () => void;
}) => {
  const { skin } = useSkinSwitch();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.prizes;
  const look = findSkin(prize.skin);
  const isCurrent = look.id === skin.id;
  const canAfford = balance >= prize.price;

  const status = isCurrent
    ? copy.wearing
    : prize.price === 0
      ? copy.free
      : prize.owned
        ? look.tagline
        : `${prize.price} · ${look.tagline}`;

  const action = () => {
    if (isCurrent) return null;
    if (prize.owned) {
      return <KilButton height={skin.size.button.sm} fontSize={skin.type.lead} label={copy.wear} onTouch={onWear} />;
    }
    if (canAfford) {
      return (
        <KilButton
          height={skin.size.button.sm}
          fontSize={skin.type.lead}
          label={copy.redeem(prize.price)}
          onTouch={onRedeem}
        />
      );
    }
    return (
      <PremiumGate
        fallback={
          <KilButton
            height={skin.size.button.sm}
            fontSize={skin.type.lead}
            variant="secondary"
            label={copy.missing(prize.price - balance)}
            onTouch={() => undefined}
          />
        }
      >
        <View style={styles.actions}>
          <KilButton
            flex={1}
            height={skin.size.button.sm}
            fontSize={skin.type.lead}
            label={`${copy.wear} · ${copy.premium}`}
            onTouch={onWear}
          />
          <KilButton
            flex={1}
            height={skin.size.button.sm}
            fontSize={skin.type.label}
            variant="secondary"
            label={copy.missing(prize.price - balance)}
            onTouch={() => undefined}
          />
        </View>
      </PremiumGate>
    );
  };

  return (
    <View
      accessible={isCurrent}
      accessibilityLabel={`${look.name}. ${status}`}
      style={[
        styles.row,
        {
          borderColor: isCurrent ? skin.actions.primary.fill : skin.colors.raised,
          borderRadius: skin.shape.radius,
          borderWidth: skin.shape.border,
        },
      ]}
    >
      <View style={[styles.swatches, { borderRadius: skin.shape.radius / 2 }]}>
        {[look.colors.ground, look.actions.primary.fill]
          .concat(LEVELS.map((level) => look.colors.levels[level]))
          .map((color, index) => (
            <View key={index} style={[styles.swatch, { backgroundColor: color }]} />
          ))}
      </View>
      <ThemedText size={skin.type.lead} color={skin.colors.onGround}>
        {look.name}
      </ThemedText>
      <ThemedText size={skin.type.caption} color={skin.colors.muted}>
        {status}
      </ThemedText>
      {action()}
    </View>
  );
};

const PrizeCounterModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const { skin, setSkin } = useSkinSwitch();
  const styles = useSkinStyles(createStyles);
  const { counter, redeem } = useTickets();
  const { showToast } = useToast();
  const copy = skin.copy.prizes;
  const balance = counter?.balance ?? 0;
  const prizes = (counter?.prizes ?? []).filter((prize) =>
    SKINS.some((known) => known.id === prize.skin),
  );

  const wear = async (prize: PrizeType) => {
    if (!(await setSkin(prize.skin))) showToast(copy.failed);
  };

  const buy = async (prize: PrizeType) => {
    if (!(await redeem(prize.id))) {
      showToast(copy.failed);
      return;
    }
    showToast(copy.redeemed(findSkin(prize.skin).name), "success");
  };

  return (
    <BottomPanel visible={visible} onClose={onClose} dismissible>
      <Title size={skin.type.headline} lines={1} color={skin.colors.accent}>
        {copy.title}
      </Title>
      <ThemedText size={skin.type.body} color={skin.colors.onGround}>
        {copy.balance(balance)}
      </ThemedText>
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {prizes.map((prize) => (
          <PrizeRow
            key={prize.id}
            prize={prize}
            balance={balance}
            onWear={() => wear(prize)}
            onRedeem={() => buy(prize)}
          />
        ))}
      </ScrollView>
      <KilButton
        height={skin.size.button.md}
        fontSize={skin.type.lead}
        variant="secondary"
        label={skin.copy.common.close}
        onTouch={onClose}
      />
    </BottomPanel>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    list: {
      maxHeight: s.size.panelList,
    },
    listContent: {
      gap: s.spacing.inline,
    },
    row: {
      gap: s.spacing.small,
      padding: s.spacing.dock,
    },
    swatches: {
      flexDirection: "row",
      height: s.size.swatch,
      overflow: "hidden",
    },
    swatch: {
      flex: 1,
    },
    actions: {
      flexDirection: "row",
      gap: s.spacing.small,
    },
  });

export default PrizeCounterModal;
