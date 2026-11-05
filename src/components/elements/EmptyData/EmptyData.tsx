import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { ArrowDownIcon } from "react-native-heroicons/solid";

const EmptyData = ({
  label = "No data available",
  onRefresh,
  pullToRefresh = true,
}: {
  label?: string;
  onRefresh?: () => unknown;
  pullToRefresh?: boolean;
}) => {
  const theme = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const content = (
    <View style={styles.container}>
      <ThemedText themeColor="textSecondary" style={styles.label}>
        {label}
      </ThemedText>
      {onRefresh && (
        <Pressable
          onPress={refresh}
          disabled={isRefreshing}
          style={[styles.hint, isRefreshing && styles.hintRefreshing]}
          accessibilityRole="button"
          accessibilityLabel="Refresh"
        >
          <ArrowDownIcon size={20} color={theme.textSecondary} />
          <ThemedText type="small" themeColor="textSecondary">
            Refresh
          </ThemedText>
        </Pressable>
      )}
    </View>
  );

  if (!onRefresh || !pullToRefresh) {
    return content;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
      }
    >
      {content}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.four,
    gap: Spacing.four,
  },
  label: {
    textAlign: "center",
  },
  hint: {
    alignItems: "center",
    gap: Spacing.one,
    padding: Spacing.two,
  },
  hintRefreshing: {
    opacity: 0.5,
  },
});

export default EmptyData;
