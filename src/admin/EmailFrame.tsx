import { A, AText } from "@/admin/ui";
import { ComponentType, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { WebViewProps } from "react-native-webview";

const MIN_HEIGHT = 480;

const REPORT_HEIGHT = `window.ReactNativeWebView.postMessage(String(document.documentElement.scrollHeight)); true;`;

const EmailFrame = ({ html }: { html: string }) => {
  const [Frame, setFrame] = useState<ComponentType<WebViewProps> | null>(null);
  const [missing, setMissing] = useState(false);
  const [height, setHeight] = useState(MIN_HEIGHT);

  useEffect(() => {
    import("react-native-webview")
      .then((module) => setFrame(() => module.WebView))
      .catch(() => setMissing(true));
  }, []);

  if (missing) {
    return (
      <View style={styles.message}>
        <AText size={14} color={A.soft}>Rebuild the app to see the email design. The plain text version works now.</AText>
      </View>
    );
  }

  if (!Frame) return <View style={[styles.frame, { height }]} />;

  return (
    <View style={[styles.frame, { height }]}>
      <Frame
        originWhitelist={["*"]}
        source={{ html }}
        scrollEnabled={false}
        injectedJavaScript={REPORT_HEIGHT}
        onMessage={(event) => {
          const measured = Number(event.nativeEvent.data);
          if (measured > 0) setHeight(Math.max(MIN_HEIGHT, measured));
        }}
        onShouldStartLoadWithRequest={(request) => /^(about|data):/.test(request.url)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    borderColor: A.line,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 20,
    overflow: "hidden",
  },
  message: {
    backgroundColor: A.card,
    borderColor: A.line,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 20,
    padding: 16,
  },
});

export default EmailFrame;
