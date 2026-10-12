import useShop from "@/providers/ShopProvider";
import ShopList from "../ShopList";
import KilButton from "@/components/elements/KilButton";
import { ThemedView } from "@/components/themed-view";

const Session = () => {
  const { startNewSession, session } = useShop();
  const handleStartSession = async () => {
    console.log("Starting new session...");

    await startNewSession();
  };
  return (
    <ThemedView>
      {session ? (
        <ShopList />
      ) : (
        <KilButton label="Start" onTouch={handleStartSession} />
      )}
    </ThemedView>
  );
};
export default Session;
