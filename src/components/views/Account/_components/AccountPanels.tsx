import ActionPanel from "@/components/elements/ActionPanel";
import type { Account } from "@/hooks/screens/useAccount";
import InviteQrModal from "./InviteQrModal";
import CreditsModal from "./CreditsModal";
import LanguageModal from "./LanguageModal";
import ThemeModal from "./ThemeModal";
import EmailCodeModal from "./EmailCodeModal";
import HouseholdNameModal from "./HouseholdNameModal";
import NameModal from "./NameModal";
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
      <LanguageModal visible={openPanel === "language"} onClose={closePanel} />
      <ThemeModal visible={openPanel === "theme"} onClose={closePanel} />
      <EmailCodeModal visible={openPanel === "emailCode"} onClose={closePanel} />
      <NameModal visible={openPanel === "name"} onClose={closePanel} />
      <HouseholdNameModal
        visible={openPanel === "householdName"}
        current={account.householdName ?? ""}
        onClose={closePanel}
      />
      <CreditsModal visible={openPanel === "credits"} onClose={closePanel} onOpenIcons={account.openIconsSite} />
      <SwitchHouseholdModal
        visible={openPanel === "switch"}
        onClose={closePanel}
        onSubmit={account.switchTo}
      />
    </>
  );
};

export default AccountPanels;
