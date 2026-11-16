import type { Skin } from "@/skins/types";
import { StyleSheet } from "react-native";

/** Pill / round button shape shared by CButton and the card pads. */
export const createButtonStyles = (s: Skin) =>
  StyleSheet.create({
    button: {
      alignItems: "center",
      alignSelf: "center",
      borderRadius: s.size.button.md / 2,
      borderWidth: s.shape.border,
      flexDirection: "row",
      gap: s.spacing.tight + 2,
      height: s.size.button.md,
      justifyContent: "center",
    },
    pill: { paddingHorizontal: s.spacing.stack },
    round: { width: s.size.button.md },
    /** A centred, wrapping row of buttons (docks, pads). */
    actionRow: {
      alignItems: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: s.spacing.small + 2,
      justifyContent: "center",
    },
  });
