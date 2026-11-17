import { createContext, type ReactNode, useContext, useEffect, useState, useSyncExternalStore } from "react";

export type DockEntry = {
  owner: string;
  mode: string;
  depth: number;
  node: ReactNode;
  glass: boolean;
};

export const createDockStore = () => {
  const entries = new Map<string, DockEntry>();
  const listeners = new Set<() => void>();
  let top: DockEntry | null = null;
  let height = 0;
  let hosts = 0;
  let covers = 0;
  const emit = () => listeners.forEach((listener) => listener());
  const refreshTop = () => {
    const list = [...entries.values()];
    top = list[list.length - 1] ?? null;
  };

  return {
    top: () => top,
    height: () => height,
    hasHost: () => hosts > 0,
    covered: () => covers > 0,
    cover: () => {
      covers += 1;
      emit();
      return () => {
        covers -= 1;
        emit();
      };
    },
    show: (entry: DockEntry) => {
      entries.set(entry.owner, entry);
      refreshTop();
      emit();
    },
    clear: (owner: string) => {
      if (!entries.delete(owner)) return;
      refreshTop();
      emit();
    },
    setHeight: (next: number) => {
      if (next === height) return;
      height = next;
      emit();
    },
    mountHost: () => {
      hosts += 1;
      emit();
      return () => {
        hosts -= 1;
        emit();
      };
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};

export type DockStore = ReturnType<typeof createDockStore>;

const DockStoreContext = createContext<DockStore | null>(null);

export const DockStoreProvider = ({ children }: { children: ReactNode }) => {
  const [store] = useState(createDockStore);
  return <DockStoreContext.Provider value={store}>{children}</DockStoreContext.Provider>;
};

export const useDockStore = () => useContext(DockStoreContext);

const none = () => () => {};

export const useDockTop = (store: DockStore | null) =>
  useSyncExternalStore(store?.subscribe ?? none, () => store?.top() ?? null);

export const useDockHeight = (store: DockStore | null) =>
  useSyncExternalStore(store?.subscribe ?? none, () => store?.height() ?? 0);

export const useDockHosted = (store: DockStore | null) =>
  useSyncExternalStore(store?.subscribe ?? none, () => store?.hasHost() ?? false);

export const useDockCovered = (store: DockStore | null) =>
  useSyncExternalStore(store?.subscribe ?? none, () => store?.covered() ?? false);

export const useCoverDock = (covering: boolean) => {
  const store = useDockStore();
  useEffect(() => {
    if (covering && store) return store.cover();
  }, [covering, store]);
};
