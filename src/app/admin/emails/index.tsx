import { AdminEmailTemplate, emailTitle, useAdmin } from "@/admin/api";
import { AEmpty, ALoading, ARow, AScreen, ASection } from "@/admin/ui";

const EmailsScreen = () => {
  const { data, isValidating, mutate } = useAdmin<AdminEmailTemplate[]>("/emails/templates");

  if (!data) return <ALoading />;

  return (
    <AScreen back title="Emails" refreshing={isValidating} onRefresh={() => mutate()}>
      <ASection title="Activity">
        <ARow first label="History" value="Everything sent" href="/admin/emails/history" />
      </ASection>
      <ASection title="Templates" note="Read only. Previews use sample data.">
        {data.length === 0 && <AEmpty line="No templates." />}
        {data.map((template, index) => (
          <ARow
            key={`${template.id}-${template.skin ?? "default"}`}
            first={index === 0}
            label={emailTitle(template.id, template.skin)}
            sub={template.subject}
            href={`/admin/emails/template?id=${template.id}${template.skin ? `&skin=${template.skin}` : ""}`}
          />
        ))}
      </ASection>
    </AScreen>
  );
};

export default EmailsScreen;
