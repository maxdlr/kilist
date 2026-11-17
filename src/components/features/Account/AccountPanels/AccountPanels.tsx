import type { Account } from "@/hooks/screens/useAccount";
import InviteQrModal from "./_components/InviteQrModal";
import CreditsModal from "./_components/CreditsModal";
import DeleteAccountModal from "./_components/DeleteAccountModal";
import LanguageModal from "./_components/LanguageModal";
import ThemeModal from "./_components/ThemeModal";
import EmailCodeModal from "./_components/EmailCodeModal";
import HouseholdNameModal from "./_components/HouseholdNameModal";
import NameModal from "./_components/NameModal";
import NotificationsModal from "./_components/NotificationsModal";
import SwitchHouseholdModal from "./_components/SwitchHouseholdModal";

const AccountPanels = ({ account }: { account: Account }) => {
  const { openPanel, closePanel } = account;

  return (
    <>
      <DeleteAccountModal visible={openPanel === "delete"} onClose={closePanel} />
      <InviteQrModal
        visible={openPanel === "qr"}
        joinCode={account.joinCode}
        onClose={closePanel}
      />
      <LanguageModal visible={openPanel === "language"} onClose={closePanel} />
      <ThemeModal visible={openPanel === "theme"} onClose={closePanel} />
      <EmailCodeModal visible={openPanel === "emailCode"} onClose={closePanel} />
      <NameModal visible={openPanel === "name"} onClose={closePanel} />
      <NotificationsModal visible={openPanel === "notifications"} onClose={closePanel} />
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
