import Suggestions from "@/components/elements/Suggestions";
import { getLang } from "@/i18n";
import { suggestNames } from "@/offline/foodNames";

const MAX_SUGGESTIONS = 8;

const NameSuggestions = ({ query, onPick }: { query: string; onPick: (name: string) => void }) => (
  <Suggestions
    query={query}
    items={suggestNames(query, getLang(), MAX_SUGGESTIONS).map((name) => ({ key: name, label: name }))}
    onPick={onPick}
  />
);

export default NameSuggestions;
