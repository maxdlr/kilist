import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type TabBarContextType = {
  isHidden: boolean;
  hide: () => () => void;
};

const TabBarContext = createContext<TabBarContextType>({
  isHidden: false,
  hide: () => () => {},
});

export const TabBarProvider = ({ children }: { children: ReactNode }) => {
  const [hideCount, setHideCount] = useState(0);

  const hide = useCallback(() => {
    setHideCount((count) => count + 1);
    return () => setHideCount((count) => count - 1);
  }, []);

  const value = useMemo(
    () => ({ isHidden: hideCount > 0, hide }),
    [hideCount, hide],
  );

  return (
    <TabBarContext.Provider value={value}>{children}</TabBarContext.Provider>
  );
};

export const useTabBarVisibility = () => React.useContext(TabBarContext);

export const useHideTabBar = (shouldHide: boolean) => {
  const { hide } = useTabBarVisibility();

  useEffect(() => {
    if (shouldHide) return hide();
  }, [shouldHide, hide]);
};
