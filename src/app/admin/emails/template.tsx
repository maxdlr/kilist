import { AdminEmailPreview, emailTitle, query, useAdmin } from "@/admin/api";
import EmailFrame from "@/admin/EmailFrame";
import { A, AChips, ALoading, ARow, AScreen, ASection, AText } from "@/admin/ui";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
] as const;

const VIEWS = [
  { value: "design", label: "Design" },
  { value: "text", label: "Plain text" },
] as const;

type Language = (typeof LANGUAGES)[number]["value"];
type Mode = (typeof VIEWS)[number]["value"];

const TemplateScreen = () => {
  const { id, skin } = useLocalSearchParams<{ id: string; skin?: string }>();
  const [lang, setLang] = useState<Language>("en");
  const [view, setView] = useState<Mode>("design");
  const { data, isValidating, mutate } = useAdmin<AdminEmailPreview>(`/emails/templates/${id}${query({ lang, skin })}`);

  if (!data) return <ALoading />;

  return (
    <AScreen
      back
      backLabel="Emails"
      title={emailTitle(id, skin)}
      subtitle="Read only · sample data"
      refreshing={isValidating}
      onRefresh={() => mutate()}
    >
      <View style={styles.controls}>
        <AChips options={[...LANGUAGES]} value={lang} onChange={setLang} />
        <AChips options={[...VIEWS]} value={view} onChange={setView} />
      </View>
      <ASection title="In the inbox">
        <ARow first label="Subject" sub={data.subject} />
        <ARow label="Preview text" sub={data.preheader} />
      </ASection>
      {view === "design" ? (
        <EmailFrame html={data.html} />
      ) : (
        <View style={styles.text}>
          <AText size={14} color={A.ink} selectable>{data.text}</AText>
        </View>
      )}
    </AScreen>
  );
};

const styles = StyleSheet.create({
  controls: { gap: 8, paddingHorizontal: 20 },
  text: {
    backgroundColor: A.card,
    borderColor: A.line,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 20,
    padding: 16,
  },
});

export default TemplateScreen;
