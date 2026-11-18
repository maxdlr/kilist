import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({ Linking: { openURL: vi.fn() } }));
vi.mock("expo-router", () => ({ router: { navigate: vi.fn() } }));

import { describeNewsUrl, isWebUrl, NEWS_VIEWS, newsUrl, parseNewsUrl, WEB_LINK } from "../actions";

const API_PATTERN = /^\/[A-Za-z0-9_\-/]*(\?[A-Za-z0-9_\-=&]*)?$/;

describe("news actions", () => {
  it("builds app routes the API accepts, and reads them back", () => {
    for (const view of NEWS_VIEWS) {
      for (const trigger of [null, ...view.triggers.map((entry) => entry.id)]) {
        const url = newsUrl(view.id, trigger)!;
        expect(url).toMatch(API_PATTERN);
        expect(describeNewsUrl(url)).toContain(view.label);
      }
    }
  });

  it("opens the theme menu from account settings", () => {
    expect(newsUrl("account", "theme")).toBe("/account?panel=theme");
    expect(describeNewsUrl("/account?panel=theme")).toBe("Account settings → Theme");
    expect(newsUrl(null, null)).toBeNull();
  });

  it("recognises web links and nothing else", () => {
    expect(isWebUrl("https://kilist.app/blog?x=1")).toBe(true);
    expect(isWebUrl("http://kilist.app")).toBe(true);
    expect(isWebUrl("javascript:alert(1)")).toBe(false);
    expect(isWebUrl("//evil.example")).toBe(false);
    expect(isWebUrl("/account?panel=theme")).toBe(false);
    expect(describeNewsUrl("https://kilist.app/blog")).toBe("Web link → kilist.app/blog");
    expect(parseNewsUrl("https://kilist.app")).toEqual({ viewId: WEB_LINK, triggerId: null });
  });
});
