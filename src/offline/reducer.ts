import {
  addHistory,
  awardSwipe,
  calculateScore,
  isShopListDone,
  nextFoods,
  normalizeName,
  suggestionKey,
  SAME_TRIP_MS,
  SNOOZE_MS,
  toLocalDay,
} from "./domain";
import type { LocalFood, LocalState, Op, Reward, Snapshot } from "./types";

const NO_REWARD: Reward = { earned: 0, bonus: 0, balance: null };

const time = (value?: string | null) => (value ? Date.parse(value) : 0);

const stockOf = (answer: string) => (answer === "in" ? true : answer === "out" ? false : null);

export const toState = (snapshot: Snapshot): LocalState => ({
  ...JSON.parse(JSON.stringify(snapshot)),
  raceAnswers: [],
  localAliases: {},
  runs: [],
});

const closeShopList = (state: LocalState, at: string, discard = false) => {
  const list = state.openShopList;
  if (!list) return;
  if (!discard && list.boughtFoodIds.length > 0) {
    const snoozed = state.foods.filter(
      (food) =>
        list.startFoodIds.includes(food.id) &&
        !list.boughtFoodIds.includes(food.id) &&
        time(food.snoozedUntil) > time(at),
    ).length;
    state.dashboard.shopLists = {
      latest: { date: at, bought: list.boughtFoodIds.length, snoozed },
      total: state.dashboard.shopLists.total + 1,
    };
    const { id: _id, ...run } = list;
    state.runs.push({ ...run, endedAt: at });
  }
  state.openShopList = null;
};

export const resolveLocalId = (state: LocalState, id: number) =>
  state.localAliases[String(id)] ?? id;

const openListFor = (state: LocalState, id: number) =>
  state.openShopList?.id === resolveLocalId(state, id) ? state.openShopList : null;

export const applyOp = (state: LocalState, op: Op): any => {
  const { payload, at } = op;
  const atMs = time(at);
  const food = (id: number): LocalFood | undefined => {
    const resolved = resolveLocalId(state, id);
    return state.foods.find((entry) => entry.id === resolved);
  };

  switch (op.type) {
    case "swipe": {
      const target = food(payload.foodId);
      if (!target) return NO_REWARD;
      addHistory(target, { isInStock: payload.isInStock, at });
      return awardSwipe(state, target.id, at);
    }

    case "swipe.complete": {
      const tzOffset = payload.tzOffset ?? 0;
      if (state.playedAt.some((played) => toLocalDay(played, tzOffset) === toLocalDay(at, tzOffset))) {
        return null;
      }
      state.playedAt.push(at);
      state.dashboard.swipes = {
        latest: { date: at, swiped: 0 },
        total: state.dashboard.swipes.total + 1,
      };
      return null;
    }

    case "race.answer": {
      const target = food(payload.foodId);
      state.raceAnswers.push({
        raceId: payload.raceId,
        foodId: payload.foodId,
        answer: payload.answer,
        ms: payload.ms,
      });
      if (!target) return NO_REWARD;
      addHistory(target, { isInStock: stockOf(payload.answer), at });
      return awardSwipe(state, target.id, at);
    }

    case "shop.start": {
      if (state.openShopList) {
        state.localAliases[String(payload.tempId)] = state.openShopList.id;
        return state.openShopList.id;
      }
      state.openShopList = {
        id: payload.tempId,
        startFoodIds: [...payload.foodIds],
        boughtFoodIds: [],
        buyLog: [],
        startedAt: null,
        createdAt: at,
      };
      return payload.tempId;
    }

    case "shop.clock": {
      const list = openListFor(state, payload.shopListId);
      if (list) list.startedAt = at;
      return null;
    }

    case "shop.buy": {
      const target = food(payload.foodId);
      const list = openListFor(state, payload.shopListId);
      if (!target) return [];

      if (list) {
        const last = list.buyLog[list.buyLog.length - 1];
        if (
          last &&
          last.foodId !== target.id &&
          atMs - time(last.at) <= SAME_TRIP_MS
        ) {
          const row = state.frequencies.find(
            (entry) => entry.foodId === last.foodId && entry.nextFoodId === target.id,
          );
          if (row) row.count += 1;
          else state.frequencies.push({ foodId: last.foodId, nextFoodId: target.id, count: 1 });
        }
        if (!list.boughtFoodIds.includes(target.id)) list.boughtFoodIds.push(target.id);
        if (!list.startFoodIds.includes(target.id)) list.startFoodIds.push(target.id);
        if (!list.buyLog.some((entry) => entry.foodId === target.id)) {
          list.buyLog.push({ foodId: target.id, at });
        }
      }

      target.histories = target.histories.filter((entry) => time(entry.at) > atMs);
      target.inStockScore = calculateScore(target.histories);
      if (time(target.lastBoughtAt) < atMs) target.lastBoughtAt = at;

      const suggested = nextFoods(state, target.id, list, atMs);
      if (list && isShopListDone(list, state.foods)) closeShopList(state, at);
      return suggested;
    }

    case "shop.snooze": {
      const target = food(payload.foodId);
      if (!target) return [];
      const until = atMs + SNOOZE_MS;
      if (time(target.snoozedUntil) < until) target.snoozedUntil = new Date(until).toISOString();
      return nextFoods(state, target.id, openListFor(state, payload.shopListId), atMs);
    }

    case "shop.cancel": {
      if (openListFor(state, payload.shopListId)) closeShopList(state, at, payload.discard === true);
      return null;
    }

    case "food.create": {
      const listId = payload.listId;
      const twin = state.foods.find(
        (entry) => normalizeName(entry.name) === normalizeName(payload.name),
      );
      if (twin) {
        state.localAliases[String(payload.tempId)] = twin.id;
        if (!twin.lists.includes(listId)) twin.lists.push(listId);
        if (payload.needed === true) addHistory(twin, { isInStock: false, at });
        return twin;
      }
      const created: LocalFood = {
        id: payload.tempId,
        name: payload.name,
        description: payload.description,
        icon: payload.fromOnboarding ? (payload.icon ?? null) : null,
        inStockScore: payload.fromOnboarding ? 0.5 : 1,
        snoozedUntil: null,
        lastBoughtAt: null,
        lists: [listId],
        histories: [],
      };
      state.foods.push(created);
      if (payload.needed === true) addHistory(created, { isInStock: false, at });
      return created;
    }

    case "food.edit": {
      const target = food(payload.foodId);
      if (!target) return null;
      if (payload.name !== undefined) target.name = payload.name;
      if (payload.description !== undefined) target.description = payload.description;
      return target;
    }

    case "food.remove": {
      for (const id of payload.foodIds as number[]) {
        const target = food(id);
        if (target) target.lists = target.lists.filter((listId) => listId !== payload.listId);
      }
      if (state.openShopList && isShopListDone(state.openShopList, state.foods)) {
        closeShopList(state, at);
      }
      return null;
    }

    case "me.skin":
      state.user.skin = payload.skin;
      return state.user;

    case "me.language":
      state.user.language = payload.language ?? null;
      return state.user;

    case "me.notifications":
      state.user.notifications = { ...(state.user.notifications ?? {}), [payload.event]: payload.choice };
      return state.user;

    case "household.profiles":
      state.household.eaterProfiles = [
        ...new Set((Array.isArray(payload.profiles) ? payload.profiles : []).filter((id) => typeof id === "string")),
      ] as string[];
      return state.household;

    case "suggestion.decline": {
      if (typeof payload.name !== "string" || !payload.name.trim()) return null;
      const declined = (state.household.declinedSuggestions ??= {});
      const key = suggestionKey(payload.name);
      const previous = declined[key];
      if (previous && time(previous.at) >= atMs) return null;
      declined[key] = { at, count: (previous?.count ?? 0) + 1 };
      return null;
    }

    case "prize.redeem": {
      const prize = state.prizes.prizes.find((entry) => entry.id === payload.prizeId);
      const reserved = state.prizes.reserved ?? 0;
      const funds = state.prizes.balance - (prize?.accountOnly ? reserved : 0);
      if (!prize || prize.owned || funds < prize.price) return null;
      if (!prize.accountOnly) state.prizes.reserved = Math.max(0, reserved - prize.price);
      prize.owned = true;
      prize.wearable = true;
      state.prizes.balance -= prize.price;
      return state.prizes;
    }
  }
};
