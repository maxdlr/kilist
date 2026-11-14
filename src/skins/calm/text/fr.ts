import type { CalmText } from "./en";

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const foods = (count: number) =>
  `${count} ${count <= 1 ? "aliment" : "aliments"}`;

const fr: CalmText = {
  date: (date: Date) => {
    const text = dateFormat.format(date);
    return text.charAt(0).toUpperCase() + text.slice(1);
  },
  openList: "Ouvrir la liste",
  browseInventory: "Ouvrir le garde-manger",
  close: "Fermer",
  done: "C'est fait.",
  loading: "Chargement",
  trying: "Un instant…",
  tryAgain: "Réessayer",
  errorTitle: "Connexion impossible.",
  errorLine: "Vérifie ta connexion et réessaie. Rien n'est perdu.",
  tabWaiting: (tab: string) => `${tab}, un tri attend`,
  intent: { left: "Il en faut", up: "Je ne sais pas", right: "J'en ai" },
  home: {
    allSetLine:
      "Rien à trier, rien à acheter. Kilist te préviendra quand quelque chose risque de manquer.",
    toCheck: (count: number) => `${foods(count)} à trier`,
    checkLine:
      "Environ trente secondes. Ça garde la liste juste, et chaque réponse rapporte des points pour d'autres styles.",
    onTheList: "Sur la liste",
    more: (count: number) => `et ${count} de plus`,
    ready: "Ta liste est prête.",
    goShop: "Faire les courses",
    sortTime: "30 s",
    sortPoints: (points: number) => `+${points} points`,
  },
  stock: { sure: "À acheter", maybe: "Peut-être", stocked: "En stock" },
  play: {
    question: "Il t'en reste ?",
    position: (at: number, total: number) => `${at} sur ${total}`,
    showLabels: "Afficher le nom des boutons",
    ariaOut: "Plus en stock",
    ariaIn: "En stock",
    added: (count: number) =>
      `${foods(count)} ${count <= 1 ? "ajouté" : "ajoutés"} à ta liste.`,
    nothingNew: "Rien de nouveau à acheter. La liste est à jour.",
    points: "Points pour d'autres styles",
    pointsTotal: (earned: number, total: number) =>
      `+${earned} · ${total} au total`,
    replay: "Rejouer la partie du jour",
    sortedToday: "Trié pour aujourd'hui.",
    replayTitle: "Une erreur ?",
    replayReplaces: "Remplace tes réponses",
    replayNoPoints: "0 point en plus",
    replayLine:
      "Rejouer remplace tes réponses d'aujourd'hui et ne rapporte pas de points en plus.",
  },
  shop: {
    otherAisle: "Autres",
    title: "Liste",
    toBuy: (count: number) => `${count} à acheter`,
    hint: "Glisse à droite quand c'est dans le panier, à gauche pour la prochaine fois.",
    hintAria:
      "Glisse à droite quand c'est dans le panier, à gauche pour le garder pour la prochaine fois",
    inBasket: "Dans le panier",
    inBasketAria: (name: string) => `${name}, dans le panier`,
    nextTime: "La prochaine fois",
    later: "Plus tard",
    usuallyNext: "D'habitude juste après",
    result: (bought: number, left: number) =>
      `${bought} ${bought <= 1 ? "acheté" : "achetés"}${left ? `, ${left} pour la prochaine fois` : ""}.`,
    backToday: "Retour à l'accueil",
    legendBasket: "Au panier",
    howAria: "Comment ça marche",
  },
  inventory: {
    clear: "Effacer",
    editOne: "Modifier",
    addQuery: (query: string) => `Ajouter « ${query} »`,
    noResultsLine: "Ajoute-le et Kilist commencera à le suivre.",
    emptyLine:
      "Ajoute les aliments que tu achètes d'habitude, et Kilist tient la liste pour toi.",
  },
  tutorial: {
    skip: "Passer",
    profileTitle: "Tu manges quoi ?",
    profileLine:
      "On remplit ton inventaire pour toi. Tu pourras le changer plus tard.",
    questionAt: (at: number, total: number) => `Question ${at} sur ${total}`,
    questionNext: "Suivant",
    questionBack: "Retour",
    questions: {
      diet: {
        title: "Comment mange ton foyer ?",
        line: "Choisis ce qui s'en rapproche le plus.",
      },
      avoid: {
        title: "Quelque chose que tu évites ?",
        line: "Choisis tout ce qui s'applique, ou rien.",
      },
      drinks: {
        title: "Lesquels achètes-tu ?",
        line: "Choisis tout ce qui s'applique, ou rien.",
      },
      home: {
        title: "Qui d'autre vit à la maison ?",
        line: "Choisis tout ce qui s'applique, ou rien.",
      },
      baking: {
        title: "Tu fais de la pâtisserie ?",
        line: "Farine, sucre et compagnie.",
      },
    },
    answers: {
      everything: "Un peu de tout",
      noPork: "Pas de porc",
      noMeat: "Du poisson, mais pas de viande",
      veggie: "Végétarien",
      dairy: "Les produits laitiers",
      gluten: "Le gluten",
      shellfish: "Les fruits de mer",
      egg: "Les œufs",
      peanut: "Les arachides",
      nuts: "Les fruits à coque",
      soy: "Le soja",
      coffee: "Du café",
      soda: "Des sodas",
      alcohol: "De l'alcool",
      baby: "Un bébé",
      cat: "Un chat",
      dog: "Un chien",
      yes: "Oui",
      no: "Non",
    } as Record<string, string>,
    profileCount: (count: number) =>
      `${foods(count)} dans ton inventaire au départ.`,
    reviewTitle: "Tes premiers aliments",
    reviewLine:
      "Choisis d'après tes réponses. Touche un aliment pour l'ajouter ou le retirer.",
    refineTitle: "Tes aliments",
    refineLine:
      "Les aliments que tu as déjà sont sélectionnés. Touche un aliment pour l'ajouter ou le retirer.",
    refineCount: (add: number, remove: number) =>
      add + remove === 0
        ? "Aucun changement pour l'instant."
        : [add > 0 && `${add} à ajouter`, remove > 0 && `${remove} à retirer`]
            .filter(Boolean)
            .join(", ") + ".",
    profileOffline:
      "La liste d'aliments n'est pas encore téléchargée. Tu pourras ajouter tes aliments plus tard depuis l'inventaire.",
    profileDone: "Terminé",
    profileAdding: "Ajout…",
    samples: ["Bananes", "Lait", "Riz"],
    practiceLabel: (at: number, total: number) =>
      `Entraînement · ${at} sur ${total}`,
    stamps: { left: "Plus de", right: "J'en ai", up: "Pas sûr" },
    promptFirst: (name: string) => `Il te reste : ${name.toLowerCase()} ?`,
    promptFirstLine:
      "Essaie : glisse la carte à gauche, comme s'il n'y en avait plus.",
    promptRight: (name: string) =>
      `Maintenant : ${name.toLowerCase()}. Glisse à droite s'il t'en reste.`,
    promptFree: (name: string) =>
      `Dernière carte : ${name.toLowerCase()}. À gauche, à droite, ou en haut si tu ne sais pas.`,
    saidOut: (name: string) => `Il n'y a plus de : ${name.toLowerCase()}.`,
    saidOutLine:
      "Donc ça va sur ta liste de courses. Tu ne l'écris jamais toi-même.",
    saidIn: (name: string) => `Il te reste : ${name.toLowerCase()}.`,
    saidInLine: "Rien à acheter. Ça reste hors de ta liste.",
    saidUnsure: (name: string) => `Pas sûr pour : ${name.toLowerCase()}.`,
    saidUnsureLine: "Kilist te redemandera un autre jour.",
    seeList: "Voir ma liste",
    shopLabel: "Entraînement · ta liste",
    shopTitle: (count: number) => `${count} à acheter`,
    shopCaption: "Voici ta liste.",
    shopCaptionLine: (name: string) =>
      `« ${name} » y est parce que tu as dit qu'il n'y en avait plus. Glisse la ligne à droite une fois dans ton panier.`,
    shopPretend: (name: string) =>
      `Disons qu'il n'y avait plus de : ${name.toLowerCase()}. Glisse la ligne à droite une fois dans ton panier.`,
    shopBought: "Acheté. C'est de nouveau en stock.",
    shopLater:
      "Gardé pour la prochaine fois. Ça reviendra à tes prochaines courses.",
    shopNext: "Continuer",
    doneLabel: "Entraînement terminé",
    doneTitle: "C'est tout ce qu'il y a à savoir.",
    doneSteps: [
      "Chaque jour, trie 10 aliments : j'en ai, ou il n'y en a plus.",
      "Ce qui manque arrive sur ta liste.",
      "Au magasin, glisse chaque ligne quand tu l'achètes.",
    ],
    doneNote:
      "C'était un entraînement, rien n'a été enregistré. Ta première vraie partie rapporte des points.",
    start: "Commencer ma première partie",
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
