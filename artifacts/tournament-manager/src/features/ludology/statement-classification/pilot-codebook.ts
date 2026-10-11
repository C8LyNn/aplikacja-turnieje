import type { Codebook, Proposition } from "./model";

export const PILOT_CODEBOOK: Codebook = {
  id: "codebook-pilot-0.2.0",
  name: "Neoludologia — pilot",
  version: "0.2.0",
  status: "pilot",
  description:
    "Minimalny codebook do testowania pipeline'u. Mikrostanowiska są danymi podstawowymi; osie mapy pozostają modelem interpretacyjnym.",
};

export const PILOT_PROPOSITIONS: Proposition[] = [
  {
    id: "q01@0.2.0",
    codebookId: PILOT_CODEBOOK.id,
    code: "Q01",
    label: "Kryteria jakości poza indywidualnym gustem",
    definition:
      "Wypowiedź dotyczy tego, czy jakość gry może być oceniana przy użyciu kryteriów wykraczających poza osobiste upodobania odbiorcy.",
    includeRules: [
      "Bezpośrednie twierdzenia o obiektywnych albo intersubiektywnych kryteriach jakości.",
      "Rozróżnienie pomiędzy osobistym gustem a jakością wykonania.",
      "Argument, że pewne wady lub zalety można uzasadnić niezależnie od tego, czy dana osoba lubi grę.",
    ],
    excludeRules: [
      "Samo stwierdzenie, że autor lubi albo nie lubi danej gry.",
      "Ocena technicznego błędu bez szerszego wniosku o naturze oceny.",
      "Porównanie dwóch gier bez odniesienia do relacji gust–jakość.",
    ],
    positiveExamples: [
      "„Mogę tej gry nie lubić, ale sposób, w jaki realizuje swój cel, jest bardzo dobry.”",
    ],
    negativeExamples: [
      "„Nie ma sensu mówić, że gra jest dobra poza tym, czy komuś się podoba.”",
    ],
    borderlineExamples: [
      "„To jest źle zrobione” — bez wyjaśnienia, czy chodzi o standard techniczny, cel projektu czy osobisty gust.",
    ],
  },
  {
    id: "q02@0.2.0",
    codebookId: PILOT_CODEBOOK.id,
    code: "Q02",
    label: "Sprawczość jako warunek gry",
    definition:
      "Wypowiedź dotyczy tego, czy znacząca sprawczość lub interakcja gracza jest konieczna, aby dane dzieło uznać za grę.",
    includeRules: [
      "Definiowanie gry przez możliwość podejmowania decyzji, działania lub wpływania na stan systemu.",
      "Argumenty o tym, czy bardzo pasywne doświadczenie interaktywne nadal jest grą.",
      "Rozróżnianie gry od filmu, opowieści lub instalacji na podstawie roli działania gracza.",
    ],
    excludeRules: [
      "Krytyka małej liczby decyzji wyłącznie jako problemu jakości konkretnej gry.",
      "Uwagi o sterowaniu lub responsywności bez wniosku ontologicznego.",
    ],
    positiveExamples: [
      "„Jeżeli odbiorca nie ma żadnego realnego wpływu na przebieg, przestaje to być dla mnie grą.”",
    ],
    negativeExamples: [
      "„Gra może ograniczyć sprawczość niemal do minimum i nadal pozostaje grą.”",
    ],
    borderlineExamples: [
      "„Wolałbym mieć więcej wyborów” — preferencja nie oznacza jeszcze definicji gry.",
    ],
  },
  {
    id: "q03@0.2.0",
    codebookId: PILOT_CODEBOOK.id,
    code: "Q03",
    label: "Uprzywilejowanie mechanik",
    definition:
      "Wypowiedź przypisuje mechanikom szczególny lub nadrzędny status w definiowaniu albo ocenie gry.",
    includeRules: [
      "Twierdzenia, że mechaniki są najważniejszym albo uprzywilejowanym składnikiem gry.",
      "Argumenty, że narracja, oprawa lub inne elementy nie mogą zrekompensować słabej warstwy mechanicznej.",
      "Definiowanie jakości gry przede wszystkim przez działanie jej systemów i reguł.",
    ],
    excludeRules: [
      "Szczegółowa krytyka jednej mechaniki bez generalizacji.",
      "Stwierdzenie, że mechanika jest ważna, jeśli nie wynika z niego jej nadrzędność.",
    ],
    positiveExamples: [
      "„Historia może być świetna, ale jeśli mechaniki nie działają, sama nie uratuje gry.”",
    ],
    negativeExamples: [
      "„Gra może być wybitna głównie dzięki narracji, nawet gdy jej mechaniki są przeciętne.”",
    ],
    borderlineExamples: [
      "„Gameplay jest tutaj najciekawszą częścią” — opis konkretnej gry nie musi oznaczać ogólnej hierarchii wartości.",
    ],
  },
  {
    id: "q04@0.2.0",
    codebookId: PILOT_CODEBOOK.id,
    code: "Q04",
    label: "Narracja jako główna wartość gry",
    definition:
      "Wypowiedź dopuszcza lub odrzuca możliwość, że narracja stanowi główną wartość konkretnej gry i może dominować nad innymi składnikami doświadczenia.",
    includeRules: [
      "Uznanie narracji za wystarczające źródło wysokiej wartości konkretnej gry.",
      "Argument, że opowieść może pełnić w grze rolę nadrzędną wobec mechanik.",
      "Odrzucenie takiej możliwości jako niewłaściwej dla medium gier.",
    ],
    excludeRules: [
      "Samo chwalenie fabuły lub postaci.",
      "Stwierdzenie, że narracja jest jednym z kilku ważnych elementów bez określenia jej pozycji.",
    ],
    positiveExamples: [
      "„Ta gra działa przede wszystkim jako opowieść i właśnie dlatego uważam ją za bardzo dobrą.”",
    ],
    negativeExamples: [
      "„Jeżeli główną wartością dzieła jest historia, to nie jest to dobra podstawa do wysokiej oceny gry.”",
    ],
    borderlineExamples: [
      "„Fabuła była najlepszą częścią gry” — może opisywać tylko relację jakości elementów w jednym tytule.",
    ],
  },
  {
    id: "q05@0.2.0",
    codebookId: PILOT_CODEBOOK.id,
    code: "Q05",
    label: "Znaczenie celu i kontekstu projektu",
    definition:
      "Wypowiedź dotyczy oceniania gry względem jej celu, gatunku, założeń projektowych lub deklarowanych obietnic zamiast jednego uniwersalnego standardu.",
    includeRules: [
      "Ocena rozwiązania przez pytanie, czy realizuje ono zamierzony cel projektu.",
      "Dostosowywanie kryteriów oceny do gatunku, odbiorcy lub deklarowanego doświadczenia.",
      "Odrzucanie zarzutów opartych na funkcjach, których gra nie próbowała oferować.",
    ],
    excludeRules: [
      "Zwykłe wymienienie gatunku gry.",
      "Usprawiedliwienie dowolnego błędu samą intencją autora bez odniesienia do realizacji celu.",
    ],
    positiveExamples: [
      "„Nie odejmuję FPS-owi punktów za brak rozbudowanej ekonomii, jeśli nigdy nie próbował być strategią.”",
    ],
    negativeExamples: [
      "„Każdą grę powinno się oceniać według tego samego zestawu kryteriów bez względu na jej cel.”",
    ],
    borderlineExamples: [
      "„To typowa gra survivalowa” — klasyfikacja gatunku sama nie mówi, jak autor uważa, że należy ją oceniać.",
    ],
  },
];
