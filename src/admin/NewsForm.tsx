import { AdminNews, newsName, useAdminCall } from "@/admin/api";
import { A, AButton, AChips, AConfirm, AField, AScreen, ASection, ASelect, AText, ConfirmRequest } from "@/admin/ui";
import { isWebUrl, NEWS_VIEWS, newsUrl, parseNewsUrl, WEB_LINK } from "@/notifications/actions";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

const NO_TRIGGER = "none";

const pad = (value: number) => String(value).padStart(2, "0");
const dayOf = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const timeOf = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

const nextHour = () => {
  const date = new Date();
  date.setHours(date.getHours() + 1, 0, 0, 0);
  return date;
};

const tomorrowAt9 = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return date;
};

const parseLocal = (day: string, time: string) => {
  const dayMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day.trim());
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!dayMatch || !timeMatch) return null;
  const [, y, mo, d] = dayMatch.map(Number);
  const [, h, mi] = timeMatch.map(Number);
  const date = new Date(y!, mo! - 1, d!, h!, mi!);
  return date.getMonth() === mo! - 1 && h! < 24 && mi! < 60 ? date : null;
};

type Quick = "now" | "hour" | "tomorrow" | "custom";

const filled = (value: string) => value.trim() !== "";

const startOf = (news?: AdminNews) => {
  const saved = news ? new Date(news.sendAt) : null;
  const usable = saved !== null && !(news!.status === "draft" && saved.getTime() < Date.now());
  return { date: usable ? saved : nextHour(), quick: (usable ? "custom" : "hour") as Quick };
};

const NewsForm = ({ news, template }: { news?: AdminNews; template?: AdminNews }) => {
  const { call, busy } = useAdminCall();
  const source = news ?? template;
  const [checkedAt, setCheckedAt] = useState(() => Date.now());
  const [start] = useState(() => startOf(news));
  const [link] = useState(() => parseNewsUrl(source?.url ?? null));
  const [titleEn, setTitleEn] = useState(source?.titleEn ?? "");
  const [bodyEn, setBodyEn] = useState(source?.bodyEn ?? "");
  const [titleFr, setTitleFr] = useState(source?.titleFr ?? "");
  const [bodyFr, setBodyFr] = useState(source?.bodyFr ?? "");
  const [day, setDay] = useState(dayOf(start.date));
  const [time, setTime] = useState(timeOf(start.date));
  const [quick, setQuick] = useState<Quick>(start.quick);
  const [viewId, setViewId] = useState<string | null>(link.viewId);
  const [triggerId, setTriggerId] = useState<string>(link.triggerId ?? NO_TRIGGER);
  const [webLink, setWebLink] = useState(link.viewId === WEB_LINK ? (source?.url ?? "") : "");
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const isDraft = news?.status === "draft";

  const view = NEWS_VIEWS.find((entry) => entry.id === viewId);
  const sendAt = parseLocal(day, time);
  const isLink = viewId === WEB_LINK;
  const url = isLink ? webLink.trim() || null : newsUrl(viewId, triggerId === NO_TRIGGER ? null : triggerId);
  const badLink = isLink && !isWebUrl(webLink.trim());
  const langs = [
    { name: "English", title: titleEn, body: bodyEn },
    { name: "French", title: titleFr, body: bodyFr },
  ];
  const complete = langs.filter((lang) => filled(lang.title) && filled(lang.body));
  const half = langs.find((lang) => filled(lang.title) !== filled(lang.body));
  const testable = complete.length > 0 && !half && !badLink;
  const ready = testable && sendAt !== null;
  const canDraft = langs.some((lang) => filled(lang.title) || filled(lang.body));
  const blocker = half
    ? `Give the ${half.name} news both a title and a content, or leave both empty.`
    : complete.length === 0
      ? "Write a title and a content in at least one language to schedule."
      : badLink
        ? "Enter a full web link, like https://kilist.app, or remove the action."
        : !sendAt
          ? "Fix the date and time to schedule."
          : null;
  const body = { titleEn, bodyEn, titleFr, bodyFr, url, sendAt: sendAt?.toISOString() };

  const pickQuick = (next: Quick) => {
    setCheckedAt(Date.now());
    setQuick(next);
    const date = next === "now" ? new Date() : next === "hour" ? nextHour() : next === "tomorrow" ? tomorrowAt9() : null;
    if (!date) return;
    setDay(dayOf(date));
    setTime(timeOf(date));
  };

  const editDay = (value: string) => {
    setCheckedAt(Date.now());
    setQuick("custom");
    setDay(value);
  };

  const editTime = (value: string) => {
    setCheckedAt(Date.now());
    setQuick("custom");
    setTime(value);
  };

  const pickView = (id: string) => {
    setViewId(id);
    setTriggerId(NO_TRIGGER);
  };

  const save = async (draft: boolean) => {
    const payload = { ...body, draft };
    const message = draft ? "Draft saved" : "News scheduled";
    const done = news
      ? await call("put", `/news/${news.id}`, payload, message)
      : await call("post", "/news", payload, message);
    if (done) router.back();
  };

  const discard = () =>
    setConfirm({
      title: isDraft ? "Discard this draft?" : "Cancel this news?",
      line: isDraft ? "It stays in the list as cancelled." : "It won't be pushed and won't show on Home.",
      action: isDraft ? "Discard draft" : "Cancel news",
      onConfirm: async () => {
        if (await call("delete", `/news/${news!.id}`, undefined, isDraft ? "Draft discarded" : "News cancelled")) {
          router.back();
        }
      },
    });

  const test = () => call("post", "/news/test", body, "Test sent to your phones");

  const when = !sendAt
    ? "Use YYYY-MM-DD and HH:MM."
    : sendAt.getTime() <= checkedAt + 60000
      ? "Sends within a minute of scheduling."
      : `Sends ${sendAt.toLocaleString(undefined, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}, your time.`;

  return (
    <AScreen
      back
      backLabel="News"
      backTo="/admin/news"
      title={!news ? (template ? "Copy of news" : "New news") : isDraft ? "Edit draft" : "Edit news"}
      dock={
        <>
          <AButton variant="secondary" label="Save draft" disabled={!canDraft || busy} onPress={() => save(true)} flex={1} />
          <AButton label="Schedule" disabled={!ready} busy={busy} onPress={() => save(false)} flex={1} />
        </>
      }
    >
      {template && (
        <AText size={14} color={A.soft} style={styles.from}>
          {`Copied from "${newsName(template)}". Pick a new date before scheduling.`}
        </AText>
      )}
      <ASection title="English">
        <View style={styles.pad}>
          <AField label="Title" value={titleEn} onChange={setTitleEn} maxLength={120} autoCapitalize="sentences" />
          <AField label="Content" value={bodyEn} onChange={setBodyEn} maxLength={500} multiline autoCapitalize="sentences" />
        </View>
      </ASection>
      <ASection title="French" note="Each phone only gets the language it uses. Leave a language empty and its readers get nothing.">
        <View style={styles.pad}>
          <AField label="Titre" value={titleFr} onChange={setTitleFr} maxLength={120} autoCapitalize="sentences" />
          <AField label="Contenu" value={bodyFr} onChange={setBodyFr} maxLength={500} multiline autoCapitalize="sentences" />
        </View>
      </ASection>
      <ASection title="When" note={when}>
        <View style={styles.pad}>
          <AChips
            value={quick}
            onChange={pickQuick}
            options={[
              { value: "now", label: "Now" },
              { value: "hour", label: "Next full hour" },
              { value: "tomorrow", label: "Tomorrow 9:00" },
              { value: "custom", label: "Custom" },
            ]}
          />
          <View style={styles.row}>
            <View style={styles.flex}>
              <AField label="Date" value={day} onChange={editDay} placeholder="2026-12-01" keyboardType="numbers-and-punctuation" />
            </View>
            <View style={styles.flex}>
              <AField label="Time" value={time} onChange={editTime} placeholder="09:00" keyboardType="numbers-and-punctuation" />
            </View>
          </View>
        </View>
      </ASection>
      <ASection title="Action" note="Tapping the push or the Home card takes people there.">
        <View style={styles.pad}>
          <ASelect
            label="View"
            value={viewId}
            placeholder="No action"
            options={[
              ...NEWS_VIEWS.map((entry) => ({ value: entry.id, label: entry.label })),
              { value: WEB_LINK, label: "Web link (opens the browser)" },
            ]}
            onChange={pickView}
          />
          {view && view.triggers.length > 0 && (
            <ASelect
              label="Open on that view"
              value={triggerId}
              options={[
                { value: NO_TRIGGER, label: "Nothing, just the view" },
                ...view.triggers.map((trigger) => ({ value: trigger.id, label: trigger.label })),
              ]}
              onChange={setTriggerId}
            />
          )}
          {isLink && (
            <AField
              label="Link"
              value={webLink}
              onChange={setWebLink}
              placeholder="https://kilist.app"
              keyboardType="url"
              maxLength={255}
            />
          )}
          {url && !badLink && (
            <AText size={13} color={A.soft}>
              {isLink ? `Opens ${url} in the browser` : `Opens ${url}`}
            </AText>
          )}
          {viewId && <AButton variant="text" label="Remove action" onPress={() => setViewId(null)} />}
        </View>
      </ASection>
      <View style={styles.extra}>
        {blocker && (
          <AText size={14} color={A.soft}>
            {blocker}
          </AText>
        )}
        <AButton variant="secondary" label="Test on my phone" disabled={!testable || busy} onPress={test} />
        {news && (
          <AButton
            variant="text"
            label="Duplicate"
            onPress={() => router.push(`/admin/news/new?from=${news.id}`)}
          />
        )}
        {news && <AButton variant="text" label={isDraft ? "Discard draft" : "Cancel news"} onPress={discard} />}
      </View>
      <AConfirm request={confirm} onClose={() => setConfirm(null)} />
    </AScreen>
  );
};

const styles = StyleSheet.create({
  pad: { gap: 14, padding: 14 },
  row: { flexDirection: "row", gap: 12 },
  flex: { flex: 1, minWidth: 0 },
  extra: { gap: 8, paddingHorizontal: 16 },
  from: { paddingHorizontal: 16 },
});

export default NewsForm;
