import { AdminAction, useAdmin, useAdminCall } from "@/admin/api";
import { A, AButton, AChips, AConfirm, AField, ALoading, ARow, AScreen, ASection, AText, ConfirmRequest, when } from "@/admin/ui";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

type JobRun = { dryRun: boolean; affected: number; summary: string; ranAt: string };
type JobField =
  | { name: string; label: string; kind: "choice"; options: { value: string; label: string }[] }
  | { name: string; label: string; kind: "email" };
type Job = { id: string; title: string; description: string; fields: JobField[]; lastRun: JobRun | null };

const JobsScreen = () => {
  const { data: jobs, isValidating, mutate } = useAdmin<Job[]>("/jobs");
  const { data: log } = useAdmin<AdminAction[]>("/actions?limit=30");
  const { call, busy } = useAdminCall();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inputs, setInputs] = useState<Record<string, Record<string, string>>>({});
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);

  if (!jobs) return <ALoading />;

  const selected = jobs.find((job) => job.id === selectedId);
  const inputOf = (job: Job) => inputs[job.id] ?? {};
  const setField = (job: Job, name: string, value: string) =>
    setInputs((all) => ({ ...all, [job.id]: { ...all[job.id], [name]: value } }));
  const ready = !!selected && selected.fields.every((field) => (inputOf(selected)[field.name] ?? "").trim());
  const run = (job: Job, dryRun: boolean) =>
    call<JobRun>("post", `/jobs/${job.id}/run`, { dryRun, input: inputOf(job) }, undefined);

  const dryRun = async () => {
    if (!selected) return;
    const result = await run(selected, true);
    if (result) setConfirm({ title: "Dry run", line: result.summary, action: "Run it for real", onConfirm: () => run(selected, false) });
  };

  return (
    <AScreen
      back
      title="Jobs"
      subtitle="Changes across many users at once. A dry run always comes first."
      refreshing={isValidating}
      onRefresh={() => mutate()}
      dock={
        <AButton flex={1} label={selected ? "Dry run, then run" : "Pick a job"} busy={busy} disabled={!ready} onPress={dryRun} />
      }
    >
      <View style={styles.jobs}>
        {jobs.map((job) => {
          const on = job.id === selectedId;
          return (
            <Pressable
              key={job.id}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => setSelectedId(job.id)}
              style={[styles.job, { borderColor: on ? A.action : A.line, borderWidth: on ? 2 : 1 }]}
            >
              <AText weight="bold">{job.title}</AText>
              <AText size={14} color={A.mid}>{job.description}</AText>
              <AText size={13} color={A.soft}>
                {job.lastRun ? `${job.lastRun.dryRun ? "Dry run" : "Ran"} ${when(job.lastRun.ranAt)}: ${job.lastRun.summary}` : "Never run"}
              </AText>
              {on &&
                job.fields.map((field) =>
                  field.kind === "choice" ? (
                    <View key={field.name} style={styles.field}>
                      <AText size={14} color={A.mid}>{field.label}</AText>
                      <AChips options={field.options} value={inputOf(job)[field.name] ?? ""} onChange={(value) => setField(job, field.name, value)} />
                    </View>
                  ) : (
                    <AField
                      key={field.name}
                      label={field.label}
                      keyboardType="email-address"
                      value={inputOf(job)[field.name] ?? ""}
                      onChange={(value) => setField(job, field.name, value)}
                    />
                  ),
                )}
            </Pressable>
          );
        })}
      </View>

      <ASection title="Admin action log">
        {(log ?? []).length === 0 && <ARow first label="Nothing yet" tone="disabled" />}
        {(log ?? []).map((entry, index) => (
          <ARow key={entry.id} first={index === 0} label={entry.summary} sub={`${entry.admin ?? "Someone"} · ${when(entry.at)}`} />
        ))}
      </ASection>
      <AConfirm request={confirm} onClose={() => setConfirm(null)} />
    </AScreen>
  );
};

const styles = StyleSheet.create({
  jobs: { gap: 10, paddingHorizontal: 16 },
  job: { backgroundColor: A.card, borderRadius: 12, gap: 6, padding: 14 },
  field: { gap: 6 },
});

export default JobsScreen;
