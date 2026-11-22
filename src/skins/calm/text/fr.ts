import type { CalmText } from "./en";

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const foods = (count: number) =>
  `${count} ${count <= 1 ? "produit" : "produits"}`;

const joined = (names: string[]) => {
  const words = names.map((name, index) =>
    index === 0 ? name : name.toLowerCase(),
  );
  return words.length < 2
    ? (words[0] ?? "")
    : `${words.slice(0, -1).join(", ")} et ${words[words.length - 1]}`;
};

const fr: CalmText = {
  date: (date: Date) => {
    const text = dateFormat.format(date);
    return text.charAt(0).toUpperCase() + text.slice(1);
  },
  browseInventory: "Ouvrir le garde-manger",
  close: "Fermer",
  done: "C'est fait.",
  loading: "Chargement",
  trying: "Un instant…",
  tryAgain: "Réessayer",
  errorTitle: "Connexion impossible.",
  errorLine: "Vérifie ta connexion et réessaie. Rien n'est perdu.",
  tabNews: (tab: string) => `${tab}, une nouveauté t'attend`,
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
    partnerSaid: (name: string, isInStock: boolean | null) =>
      `${name} : ${isInStock === null ? "pas sûr·e" : isInStock ? "il en reste" : "plus rien"}`,
    position: (at: number, total: number) => `${at} sur ${total}`,
    showLabels: "Afficher le nom des boutons",
    undo: "Annuler la dernière carte",
    ariaOut: "Plus en stock",
    ariaIn: "En stock",
    added: (count: number) =>
      `${foods(count)} ${count <= 1 ? "ajouté" : "ajoutés"} à ta liste.`,
    nothingNew: "Rien de nouveau à acheter. La liste est à jour.",
    replay: "Rejouer la partie du jour",
    sorted: "Trié",
    today: "Pour aujourd'hui.",
    playAgainTip: "Fais une autre partie pour trier plus de produits",
    howAria: "Comment ça marche",
  },
  shop: {
    otherAisle: "Autres",
    manageAisles: "Gérer",
    manageAislesAria: "Donner un rayon aux produits de Autres",
    aislesTitle: "Range-les dans un rayon",
    aisleSearch: "Nom d'un rayon ou d'un produit",
    aisleNoMatch: "Aucun rayon trouvé.",
    aisleClear: "Effacer la recherche",
    aisleOpen: (name: string) => `Choisir un rayon pour ${name}`,
    aislePicked: (name: string, aisle: string) =>
      `${name}, ${aisle}. Changer le rayon`,
    aislesDone: "Terminé",
    aislesConfirmTitle: "Garder les rayons choisis ?",
    aislesConfirmLine: (count: number) =>
      count === 1
        ? "1 produit a un nouveau rayon."
        : `${count} produits ont un nouveau rayon.`,
    aislesConfirmKeep: "Continuer",
    aislesConfirmSave: "Les garder",
    aislesConfirmDiscard: "Tout annuler",
    title: "Liste",
    toBuy: (count: number) => `${count} à acheter`,
    inBasket: "Dans le panier",
    nextTime: "La prochaine fois",
    later: "Plus tard",
    usuallyNext: "D'habitude juste après",
    result: (bought: number, left: number) =>
      `${bought} ${bought <= 1 ? "acheté" : "achetés"}${left ? `, ${left} pour la prochaine fois` : ""}.`,
    closeRun: "Terminé",
    howAria: "Comment ça marche",
    selectToEdit: "Touche pour reporter,\nmaintiens pour modifier",
    holdToEdit: "Maintiens pour modifier",
    runHelp:
      "Touche pour acheter,\nglisse vers le haut pour plus tard,\nmaintiens pour modifier",
    pillHint:
      "Touche quand c'est dans le panier. Lance-le sur le côté pour la prochaine fois. Maintiens pour modifier.",
    aisleEmpty: "Plus rien ici",
    aisleBar: "Rayons. Glisse le long de la barre pour changer de rayon",
    aisleSegment: (name: string, count: number) =>
      count ? `${name}, ${count} à acheter` : `${name}, fini`,
  },
  inventory: {
    closeSearch: "Fermer la recherche",
    addQuery: (query: string) => `Ajouter « ${query} »`,
    noResultsLine: "Ajoute-le et Kilist commencera à le suivre.",
    emptyLine:
      "Ajoute les produits que tu achètes d'habitude, et Kilist tient la liste pour toi.",
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
        title: "Tu manges quoi ?",
        line: "Choisis ce qui s'en rapproche le plus.",
      },
      avoid: {
        title: "Qu'est-ce que tu ne manges pas ?",
        line: "Choisis tout ce qui s'applique, ou rien.",
      },
      drinks: {
        title: "Tu bois quoi ?",
        line: "Choisis tout ce qui s'applique, ou rien.",
      },
      home: {
        title: "Des animaux ?",
        line: "Choisis tout ce qui s'applique, ou rien.",
      },
      kids: {
        title: "Des enfants ?",
        line: "Des enfants qui vivent avec toi.",
      },
      extras: {
        title: "Tu achètes autre chose ?",
        line: "Pas que de la nourriture. Choisis tout ce qui s'applique, ou rien.",
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
      tea: "Du thé",
      soda: "Des sodas",
      beer: "De la bière",
      wine: "Du vin",
      spirits: "Des spiritueux",
      cat: "Un chat",
      dog: "Un chien",
      bird: "Un oiseau",
      rabbit: "Un lapin",
      rodent: "Un hamster ou un cochon d'Inde",
      aquarium: "Des poissons",
      bathroom: "Salle de bain",
      cleaning: "Produits ménagers",
      dishwasher: "Lave-vaisselle",
      yes: "Oui",
      no: "Non",
    } as Record<string, string>,
    profileCount: (count: number) =>
      `${foods(count)} dans ton inventaire au départ.`,
    reviewTitle: "Affine ta sélection",
    reviewLine:
      "Choisis d'après tes réponses. Touche un produit pour l'ajouter ou le retirer.",
    refineTitle: "Tes produits",
    refineLine:
      "Les produits que tu as déjà sont sélectionnés. Touche un produit pour l'ajouter ou le retirer.",
    refineCount: (add: number, remove: number) =>
      add + remove === 0
        ? "Aucun changement pour l'instant."
        : [add > 0 && `${add} à ajouter`, remove > 0 && `${remove} à retirer`]
            .filter(Boolean)
            .join(", ") + ".",
    profileOffline:
      "La liste de produits n'est pas encore téléchargée. Tu pourras ajouter tes produits plus tard depuis l'inventaire.",
    profileDone: "Terminé",
    profileAdding: "Ajout…",
    samples: ["Bananes", "Lait", "Riz", "Œufs", "Café"],
    readyLabel: "Entraînement",
    readyTitle: "On s'entraîne ?",
    readyLine: (cards: number) =>
      `${cards} cartes, puis une petite liste.\nRien n'est enregistré.`,
    readyGo: "C'est parti",
    practiceLabel: (at: number, total: number) =>
      `Entraînement · ${at} sur ${total}`,
    stamps: { left: "Plus de", right: "J'en ai", up: "Pas sûr" },
    promptFirst: (name: string) => `Il te reste : ${name.toLowerCase()} ?`,
    summaryTitle: "Voilà ce qui s'est passé",
    summaryOut: (names: string[]) =>
      `${joined(names)} ${names.length > 1 ? "vont" : "va"} sur ta liste de courses.`,
    summaryIn: (names: string[]) =>
      `${joined(names)} ${names.length > 1 ? "ne vont pas" : "ne va pas"} sur ta liste, il t'en reste.`,
    summaryUnsure: (names: string[]) =>
      `${joined(names)} ${names.length > 1 ? "reviendront" : "reviendra"} plus tard dans ton tri.`,
    summaryEnd:
      "Quelques gestes de temps en temps, et ta liste de courses est toujours à jour.",
    seeList: "Voir ma liste de courses",
    shopLabel: "Entraînement · ta liste",
    shopTitle: (count: number) => `${count} à acheter`,
    shopBought: "Acheté. C'est de nouveau en stock.",
    shopSwipeTitle: "Au magasin",
    shopSwipeHint: "Glisse le produit à droite, dans ton panier.",
    shopLaterTitle: "Pas aujourd'hui ?",
    shopLaterHint: "Glisse le produit à gauche, pour la prochaine fois.",
    doneLabel: "Entraînement terminé",
    doneTitle: "C'est tout ce qu'il y a à savoir.",
    doneSteps: [
      "Chaque jour, trie 10 produits.",
      "Ce qui manque arrive sur ta liste.",
      "Au magasin, \nglisse tes produits dans ton panier.",
    ],
    doneNote:
      "C'était un entraînement, rien n'a été enregistré.\nTa première vraie partie rapporte des points.",
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
