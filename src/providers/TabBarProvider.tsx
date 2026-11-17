import React, {
  createContext,
  type ComponentRef,
  type Dispatch,
  ReactNode,
  type RefObject,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { View } from "react-native";

export type GlassTarget = RefObject<ComponentRef<typeof View> | null>;

type TabBarContextType = {
  insideTabs: boolean;
  isHidden: boolean;
  hide: () => () => void;
  glassTarget: GlassTarget | null;
  setGlassTarget: Dispatch<SetStateAction<GlassTarget | null>>;
  glassDockHeight: number;
  setGlassDockHeight: Dispatch<SetStateAction<number>>;
  glassLook: object | null;
  setGlassLook: Dispatch<SetStateAction<object | null>>;
};

const TabBarContext = createContext<TabBarContextType>({
  insideTabs: false,
  isHidden: false,
  hide: () => () => {},
  glassTarget: null,
  setGlassTarget: () => {},
  glassDockHeight: 0,
  setGlassDockHeight: () => {},
  glassLook: null,
  setGlassLook: () => {},
});

export const TabBarProvider = ({ children }: { children: ReactNode }) => {
  const [hideCount, setHideCount] = useState(0);
  const [glassTarget, setGlassTarget] = useState<GlassTarget | null>(null);
  const [glassDockHeight, setGlassDockHeight] = useState(0);
  const [glassLook, setGlassLook] = useState<object | null>(null);

  const hide = useCallback(() => {
    setHideCount((count) => count + 1);
    return () => setHideCount((count) => count - 1);
  }, []);

  const value = useMemo(
    () => ({
      insideTabs: true,
      isHidden: hideCount > 0,
      hide,
      glassTarget,
      setGlassTarget,
      glassDockHeight,
      setGlassDockHeight,
      glassLook,
      setGlassLook,
    }),
    [hideCount, hide, glassTarget, glassDockHeight, glassLook],
  );

  return (
    <TabBarContext.Provider value={value}>{children}</TabBarContext.Provider>
  );
};

export const useTabBarVisibility = () => React.useContext(TabBarContext);

export const SceneInset = createContext(0);
export const useSceneInset = () => React.useContext(SceneInset);

export const useHideTabBar = (shouldHide: boolean) => {
  const { hide } = useTabBarVisibility();

  useEffect(() => {
    if (shouldHide) return hide();
  }, [shouldHide, hide]);
};
