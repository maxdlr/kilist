import type { CalmText } from "./en";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });

const foods = (count: number) => `${count} ${count <= 1 ? "aliment" : "aliments"}`;

const fr: CalmText = {
  date: (date: Date) => {
    const text = dateFormat.format(date);
    return text.charAt(0).toUpperCase() + text.slice(1);
  },
  openList: "Ouvrir la liste",
  browseFoods: "Voir les aliments",
  close: "Fermer",
  back: "Retour",
  done: "C'est fait.",
  loading: "Chargement",
  trying: "Un instant…",
  tryAgain: "Réessayer",
  errorTitle: "Connexion impossible.",
  errorLine: "Vérifie ta connexion et réessaie. Rien n'est perdu.",
  tabWaiting: (tab: string) => `${tab}, une vérification attend`,
  intent: { left: "Il en faut", up: "Je ne sais pas", right: "J'en ai" },
  home: {
    check: (count: number) => `Vérifier ${foods(count)}`,
    allSetLine: "Rien à vérifier, rien à acheter. Kilist te préviendra quand quelque chose risque de manquer.",
    toCheck: (count: number) => `${foods(count)} à vérifier`,
    checkLine: "Environ trente secondes. Ça garde la liste juste, et chaque réponse rapporte des points pour d'autres styles.",
    onTheList: "Sur la liste",
    more: (count: number) => `et ${count} de plus`,
  },
  play: {
    question: "Il t'en reste ?",
    position: (at: number, total: number) => `${at} sur ${total}`,
    ariaOut: "Plus en stock",
    ariaIn: "En stock",
    added: (count: number) => `${foods(count)} ${count <= 1 ? "ajouté" : "ajoutés"} à ta liste.`,
    nothingNew: "Rien de nouveau à acheter. La liste est à jour.",
    points: "Points pour d'autres styles",
    pointsTotal: (earned: number, total: number) => `+${earned} · ${total} au total`,
  },
  shop: {
    title: "Liste",
    toBuy: (count: number) => `${count} à acheter`,
    hint: "Glisse à droite quand c'est dans le panier, à gauche pour la prochaine fois.",
    hintAria: "Glisse à droite quand c'est dans le panier, à gauche pour le garder pour la prochaine fois",
    inBasket: "Dans le panier",
    inBasketAria: (name: string) => `${name}, dans le panier`,
    nextTime: "La prochaine fois",
    later: "Plus tard",
    usuallyNext: "D'habitude juste après",
    result: (bought: number, left: number) =>
      `${bought} ${bought <= 1 ? "acheté" : "achetés"}${left ? `, ${left} pour la prochaine fois` : ""}.`,
    backToday: "Retour à aujourd'hui",
    doneShopping: "Courses terminées",
  },
  foods: {
    clear: "Effacer",
    addQuery: (query: string) => `Ajouter « ${query} »`,
    noResultsLine: "Ajoute-le et Kilist commencera à le suivre.",
    emptyLine: "Ajoute les aliments que tu achètes d'habitude, et Kilist tient la liste pour toi.",
  },
  settings: {
    title: "Réglages",
    account: "Compte",
    with: (names: string[]) => `avec ${names.join(", ")}`,
    justYou: "Juste toi",
    invite: "Inviter quelqu'un",
    share: "Partager le code",
    app: "Application",
  },
};

export default fr;
