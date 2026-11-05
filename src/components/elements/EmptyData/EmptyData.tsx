import Dock from "@/components/elements/Dock/Dock";
import KilButton from "@/components/elements/KilButton";
import Sheet from "@/components/elements/Sheet/Sheet";
import Title from "@/components/elements/Title/Title";
import PullToRefresh from "@/components/gestures/PullToRefresh/PullToRefresh";
import { ThemedText } from "@/components/themed-text";
import { useSkin } from "@/providers/SkinProvider";
import { Href } from "expo-router";
import { useState } from "react";
import { ArrowPathIcon } from "react-native-heroicons/solid";

const EmptyData = ({
  label,
  title,
  line,
  fill,
  onRefresh,
  action,
}: {
  label?: string;
  title?: string;
  line?: string;
  fill?: string;
  onRefresh?: () => unknown;
  action?: { label: string; href: Href };
}) => {
  const skin = useSkin();
  const copy = skin.copy.empty;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const content = (
    <Sheet
      fill={fill ?? skin.colors.paper}
      dock={
        (action || onRefresh) && (
          <Dock>
            {action ? (
              <KilButton height={skin.size.button.xl} fontSize={skin.type.headline} {...action} />
            ) : (
              <KilButton
                height={skin.size.button.xl}
                fontSize={skin.type.headline}
                label={isRefreshing ? copy.refreshing : copy.refresh}
                onTouch={refresh}
                icon={(color) => <ArrowPathIcon size={skin.size.icon.action} color={color} />}
              />
            )}
          </Dock>
        )
      }
    >
      <ThemedText size={skin.type.body}>{label ?? copy.label}</ThemedText>
      <Title size={skin.type.display.lg}>{title ?? copy.title}</Title>
      <ThemedText size={skin.type.body}>{line ?? " "}</ThemedText>
    </Sheet>
  );

  return onRefresh ? (
    <PullToRefresh onRefresh={onRefresh}>{content}</PullToRefresh>
  ) : (
    content
  );
};

export default EmptyData;
