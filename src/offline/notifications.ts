import type { NotificationChoice, NotificationEvent } from "./types";

export const choicesFor = (event: NotificationEvent, guest: boolean): NotificationChoice[] => {
  const channels = guest ? event.channels.filter((channel) => channel === "push") : event.channels;
  return ["none", ...channels, ...(channels.length > 1 ? (["both"] as const) : [])];
};

export const choiceOf = (
  saved: Record<string, string> | null | undefined,
  event: NotificationEvent,
  guest: boolean,
): NotificationChoice => {
  const value = saved?.[event.id] as NotificationChoice | undefined;
  if (value && choicesFor(event, guest).includes(value)) return value;
  return guest ? event.guestDefault : event.default;
};
