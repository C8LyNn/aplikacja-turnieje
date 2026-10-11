import type { Codebook, Proposition } from "./model";

export const PILOT_CODEBOOK: Codebook = {
  id: "codebook-pilot-v1",
  name: "Neoludologia — pilot",
  version: "0.1.0",
  status: "pilot",
  description:
    "Minimalny codebook do testowania pipeline'u. Mikrostanowiska są danymi podstawowymi; osie mapy pozostają modelem interpretacyjnym.",
};

export const PILOT_PROPOSITIONS: Proposition[] = [
  {
    id: "q01",
    codebookId: PILOT_CODEBOOK.id,
    code: "Q01",
    label: "Kryteria jakości poza indywidualnym gustem",
    definition:
      "Wypowiedź dotyczy tego, czy jakość gry może być oceniana przy użyciu kryteriów wykraczających poza osobiste upodobania odbiorcy.",
    includeRules: [
      "Bezpośrednie twierdzenia o obiektywnych lub intersubiektywnych kryteriach jakości.",
      "Rozróżnienie pomiędzy osobistym gustem a jakością wykonania.",
    ],
    excludeRules: [
      "Samo stwierdzenie, że autor lubi albo nie lubi danej gry.",
      "Ocena technicznego błędu bez szerszego wniosku o naturze oceny.",
    ],
  },
  {
    id: "q02",
    codebookId: PILOT_CODEBOOK.id,
    code: "Q02",
    label: "Sprawczość jako warunek gry",
    definition:
      "Wypowiedź dotyczy tego, czy znacząca sprawczość lub interakcja gracza jest konieczna, aby dane dzieło uznać za grę.",
  },
  {
    id: "q03",
    codebookId: PILOT_CODEBOOK.id,
    code: "Q03",
    label: "Uprzywilejowanie mechanik",
    definition:
      "Wypowiedź przypisuje mechanikom szczególny lub nadrzędny status w definiowaniu albo ocenie gry.",
  },
  {
    id: "q04",
    codebookId: PILOT_CODEBOOK.id,
    code: "Q04",
    label: "Narracja jako główna wartość gry",
    definition:
      "Wypowiedź dopuszcza lub odrzuca możliwość, że narracja stanowi główną wartość konkretnej gry.",
  },
  {
    id: "q05",
    codebookId: PILOT_CODEBOOK.id,
    code: "Q05",
    label: "Znaczenie celu i kontekstu projektu",
    definition:
      "Wypowiedź dotyczy oceniania gry względem jej celu, gatunku, założeń projektowych lub deklarowanych obietnic zamiast jednego uniwersalnego standardu.",
  },
];
