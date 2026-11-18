import { AdminNews, useAdmin } from "@/admin/api";
import NewsForm from "@/admin/NewsForm";
import { ALoading } from "@/admin/ui";
import { useLocalSearchParams } from "expo-router";

const NewNewsScreen = () => {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { data: template, error } = useAdmin<AdminNews>(from ? `/news/${from}` : null);

  if (from && !template && !error) return <ALoading />;

  return <NewsForm key={template?.id ?? "blank"} template={template} />;
};

export default NewNewsScreen;
