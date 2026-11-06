import ActionPanel from "@/components/elements/ActionPanel";
import type { Account } from "@/hooks/screens/useAccount";
import InviteQrModal from "./InviteQrModal";
import PrizeCounterModal from "./PrizeCounterModal";
import SwitchHouseholdModal from "./SwitchHouseholdModal";

const AccountPanels = ({ account }: { account: Account }) => {
  const { openPanel, closePanel } = account;

  return (
    <>
      <ActionPanel
        request={openPanel === "delete" ? account.deleteRequest : null}
        onClose={closePanel}
      />
      <InviteQrModal
        visible={openPanel === "qr"}
        joinCode={account.joinCode}
        onClose={closePanel}
      />
      <PrizeCounterModal visible={openPanel === "prizes"} onClose={closePanel} />
      <SwitchHouseholdModal
        visible={openPanel === "switch"}
        onClose={closePanel}
        onSubmit={account.switchTo}
      />
    </>
  );
};

export default AccountPanels;
