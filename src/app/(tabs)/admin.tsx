import ActionPanel, {
  ActionPanelRequest,
} from "@/components/elements/ActionPanel";
import Dock from "@/components/elements/Dock/Dock";
import EmptyData from "@/components/elements/EmptyData";
import KilButton from "@/components/elements/KilButton";
import LoadingAnim from "@/components/elements/LoadingAnim/LoadingAnim";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import axios from "@/services/axios";
import useAuth from "@/providers/AuthProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import useToast from "@/providers/ToastProvider";
import type { Skin } from "@/skins/types";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useSWR from "swr";

type JobRun = {
  dryRun: boolean;
  affected: number;
  summary: string;
  ranAt: string;
};

type AdminJob = {
  id: string;
  title: string;
  description: string;
  lastRun: JobRun | null;
};

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const AdminScreen = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.admin;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.type === "admin";
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [confirm, setConfirm] = useState<ActionPanelRequest | null>(null);

  const { data: jobs, isLoading, mutate } = useSWR<AdminJob[]>(
    isAdmin ? { url: "/admin/jobs" } : null,
  );

  useStatusBarStyle(skin.statusBarOnGround);

  useFocusEffect(
    useCallback(() => {
      if (isAdmin) mutate();
    }, [isAdmin, mutate]),
  );

  const closeConfirm = useCallback(() => setConfirm(null), []);

  if (!isAdmin) {
    return <EmptyData label={copy.adminsOnly} title={copy.adminsOnly} />;
  }

  if (isLoading && !jobs) {
    return <LoadingAnim />;
  }

  const selected = jobs?.find((job) => job.id === selectedId);

  const run = async (job: AdminJob, dryRun: boolean) => {
    setIsBusy(true);
    try {
      const res = await axios.post<JobRun>(`/admin/jobs/${job.id}/run`, {
        dryRun,
      });
      await mutate();
      return res.data;
    } catch (err: any) {
      showToast(err?.response?.data?.message || "The job failed");
      return null;
    } finally {
      setIsBusy(false);
    }
  };

  const dryRun = async () => {
    if (!selected) return;
    const result = await run(selected, true);
    if (result) showToast(result.summary, "info");
  };

  const runForReal = async () => {
    if (!selected) return;
    const preview = await run(selected, true);
    if (!preview) return;
    setConfirm({
      title: copy.confirmTitle(selected.title),
      message: preview.summary,
      actions: [
        {
          label: copy.run,
          destructive: true,
          onPress: async () => {
            const result = await run(selected, false);
            if (result) showToast(result.summary, "success");
          },
        },
      ],
    });
  };

  return (
    <View style={[styles.flex, { backgroundColor: skin.colors.ground }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + skin.spacing.top },
        ]}
      >
        <Title size={skin.type.display.sm} lines={2} color={skin.colors.accent}>
          {copy.title}
        </Title>
        <ThemedText size={skin.type.body} color={skin.colors.onGround}>
          {copy.intro}
        </ThemedText>

        {(jobs ?? []).map((job) => {
          const isSelected = job.id === selectedId;
          return (
            <Pressable
              key={job.id}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={job.title}
              onPress={() => setSelectedId(job.id)}
              style={[
                styles.job,
                {
                  backgroundColor: skin.colors.paper,
                  borderColor: isSelected
                    ? skin.actions.primary.fill
                    : skin.colors.onPaper,
                  borderRadius: skin.shape.radius,
                  borderWidth: isSelected
                    ? skin.shape.accentBorder + skin.shape.border
                    : skin.shape.border,
                },
              ]}
            >
              <ThemedText size={skin.type.lead} color={skin.colors.onPaper}>
                {job.title}
              </ThemedText>
              <ThemedText size={skin.type.caption} color={skin.colors.onPaper}>
                {job.description}
              </ThemedText>
              <ThemedText
                mono
                size={skin.type.mono}
                color={skin.colors.placeholder}
              >
                {job.lastRun
                  ? copy.lastRun(
                      formatWhen(job.lastRun.ranAt),
                      job.lastRun.summary,
                      job.lastRun.dryRun,
                    )
                  : copy.never}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      <Dock row>
        {selected ? (
          <>
            <KilButton
              flex={1}
              height={skin.size.button.md}
              fontSize={skin.type.lead}
              variant="secondary"
              label={copy.dryRun}
              onTouch={isBusy ? undefined : dryRun}
            />
            <KilButton
              flex={1}
              height={skin.size.button.md}
              fontSize={skin.type.lead}
              label={copy.run}
              onTouch={isBusy ? undefined : runForReal}
            />
          </>
        ) : (
          <KilButton
            flex={1}
            height={skin.size.button.md}
            fontSize={skin.type.lead}
            variant="secondary"
            label={copy.pick}
            onTouch={() => undefined}
          />
        )}
      </Dock>

      <ActionPanel request={confirm} onClose={closeConfirm} />
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    content: {
      gap: s.spacing.stack,
      paddingBottom: s.spacing.section,
      paddingHorizontal: s.spacing.gutter,
    },
    job: {
      gap: s.spacing.small,
      padding: s.spacing.dock,
    },
  });

export default AdminScreen;
