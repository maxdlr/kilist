import db from "@/offline/db";
import { installId } from "@/offline/stats";
import axios from "@/services/axios";

export type NewsEventKind = "push_open" | "card_open" | "card_close";

const KEY_REPORTED = "keep:newsReported";
const KEEP_REPORTED = 200;

export const reportNewsEvent = (newsId: number, kind: NewsEventKind) => {
  const key = `${newsId}:${kind}`;
  const reported = db.loadValue<string[]>(KEY_REPORTED) ?? [];
  if (reported.includes(key)) return;
  axios
    .post(`/news/${newsId}/events`, { installId: installId(), kind }, { network: true } as object)
    .then(() => db.saveValue(KEY_REPORTED, [key, ...reported].slice(0, KEEP_REPORTED)))
    .catch(() => {});
};
