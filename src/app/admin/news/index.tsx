import { AdminNews, newsDate, newsName, newsStatus, Paged, useAdmin } from "@/admin/api";
import { AButton, AEmpty, ALoading, ARow, AScreen, ASection } from "@/admin/ui";
import { describeNewsUrl } from "@/notifications/actions";
import { router } from "expo-router";

const NewsScreen = () => {
  const { data, isValidating, mutate } = useAdmin<Paged<AdminNews>>("/news");

  if (!data) return <ALoading />;

  const open = (news: AdminNews) => router.push(`/admin/news/${news.id}`);

  return (
    <AScreen
      back
      title="News"
      count={data.total}
      refreshing={isValidating}
      onRefresh={() => mutate()}
      dock={<AButton flex={1} label="New news" onPress={() => router.push("/admin/news/new")} />}
    >
      <ASection note="Each language goes to phones using it: pushed to guests and users who allow news, and shown as a card on Home.">
        {data.items.length === 0 && <AEmpty line="No news yet." />}
        {data.items.map((news, index) => (
          <ARow
            key={news.id}
            first={index === 0}
            label={newsName(news)}
            sub={
              [
                newsStatus(news),
                ...(news.status === "draft" ? [] : [newsDate(news.sendAt)]),
                news.langs.length
                  ? news.langs.join(" ").toUpperCase()
                  : [news.titleEn, news.bodyEn, news.titleFr, news.bodyFr].some(Boolean)
                    ? "Incomplete"
                    : "No text",
                describeNewsUrl(news.url),
              ].join(" · ")
            }
            value={news.status === "sent" ? `${news.delivered} sent\n${news.engagement.opened} opened` : undefined}
            onPress={news.status === "sending" ? undefined : () => open(news)}
          />
        ))}
      </ASection>
    </AScreen>
  );
};

export default NewsScreen;
