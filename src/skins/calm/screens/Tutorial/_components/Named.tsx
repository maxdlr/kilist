import { CText } from "@/skins/calm/components";

const escaped = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const Named = ({
  text,
  names,
  size,
  color,
}: {
  text: string;
  names: string[];
  size: number;
  color?: string;
}) => {
  const wanted = names.filter(Boolean);
  if (wanted.length === 0) return <>{text}</>;
  const pattern = new RegExp(`(${wanted.map(escaped).join("|")})`, "gi");
  return (
    <>
      {text.split(pattern).map((part, index) =>
        index % 2 === 1 ? (
          <CText key={index} weight="bold" size={size} color={color}>
            {part}
          </CText>
        ) : (
          part
        ),
      )}
    </>
  );
};

export default Named;
