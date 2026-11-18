import { AdminNews, EDITABLE_NEWS, newsDate, newsName, newsStatus, useAdmin, useAdminCall } from "@/admin/api";
import NewsForm from "@/admin/NewsForm";
import { A, AButton, AConfirm, AEmpty, ALoading, ARow, AScreen, ASection, AText, ConfirmRequest } from "@/admin/ui";
import { describeNewsUrl } from "@/notifications/actions";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

const LANGS = [
  { name: "English", title: "titleEn", body: "bodyEn" },
  { name: "French", title: "titleFr", body: "bodyFr" },
] as const;

const PastNews = ({ news }: { news: AdminNews }) => {
  const { call } = useAdminCall();
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const sent = news.status === "sent";

  const hide = () =>
    setConfirm({
      title: "Hide this news?",
      line: "The push is already out. This removes the card from Home for everyone.",
      action: "Hide card",
      onConfirm: () => call("delete", `/news/${news.id}`, undefined, "Card hidden"),
    });

  return (
    <AScreen
      back
      backLabel="News"
      backTo="/admin/news"
      title={newsName(news)}
      subtitle={newsStatus(news)}
      dock={
        <>
          {sent && <AButton variant="secondary" label="Hide card" onPress={hide} flex={1} />}
          <AButton label="Duplicate" onPress={() => router.push(`/admin/news/new?from=${news.id}`)} flex={1} />
        </>
      }
    >
      <ASection title="Delivery">
        <ARow first label={news.status === "sent" ? "Sent" : "Planned for"} value={newsDate(news.sentAt ?? news.sendAt)} />
        {news.status === "sent" && <ARow label="Phones reached" value={String(news.delivered)} />}
        {news.failed > 0 && <ARow label="Failed" value={String(news.failed)} />}
        <ARow label="Action" value={describeNewsUrl(news.url)} />
        {news.author && <ARow label="By" value={news.author.username} />}
      </ASection>
      <ASection
        title="Who took the bait"
        note="Counted once per phone. Home card opens don't need the push, so they can outnumber phones reached."
      >
        <ARow first label="Opened" value={String(news.engagement.opened)} />
        <ARow
          label="From the push"
          value={
            news.delivered > 0
              ? `${news.engagement.pushOpens} (${Math.round((news.engagement.pushOpens / news.delivered) * 100)}% of phones reached)`
              : String(news.engagement.pushOpens)
          }
        />
        <ARow label="From the Home card" value={String(news.engagement.cardOpens)} />
        <ARow label="Closed without opening" value={String(news.engagement.closed)} />
      </ASection>
      {LANGS.map((lang) => {
        const title = news[lang.title];
        const body = news[lang.body];
        return (
          <ASection key={lang.name} title={lang.name}>
            {title || body ? (
              <View style={styles.text}>
                <AText weight="bold">{title || "No title"}</AText>
                <AText color={A.mid}>{body || "No content"}</AText>
              </View>
            ) : (
              <AEmpty line={`Not written in ${lang.name}, so ${lang.name} phones got nothing.`} />
            )}
          </ASection>
        );
      })}
      <AConfirm request={confirm} onClose={() => setConfirm(null)} />
    </AScreen>
  );
};

const NewsScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: news, error } = useAdmin<AdminNews>(`/news/${id}`);

  if (!news) {
    return error ? (
      <AScreen back backLabel="News" backTo="/admin/news" title="News">
        <AEmpty line="This news could not be loaded." />
      </AScreen>
    ) : (
      <ALoading />
    );
  }

  if (!EDITABLE_NEWS.includes(news.status)) return <PastNews news={news} />;

  return <NewsForm key={news.id} news={news} />;
};

const styles = StyleSheet.create({
  text: { gap: 6, padding: 14 },
});

export default NewsScreen;
