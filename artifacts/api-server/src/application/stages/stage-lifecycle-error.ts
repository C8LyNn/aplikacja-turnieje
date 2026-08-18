export type StageLifecycleErrorCode =
  | "TOURNAMENT_NOT_FOUND"
  | "STAGE_NOT_FOUND"
  | "STAGE_NOT_ACTIVE"
  | "STAGE_NOT_NEXT_PLANNED"
  | "ACTIVE_STAGE_EXISTS"
  | "PREVIOUS_STAGE_NOT_COMPLETED"
  | "STAGE_INCOMPLETE"
  | "STAGE_PARTICIPANTS_INCONSISTENT"
  | "STAGE_BASKET_CONFIGURATION_INVALID"
  | "QUALIFICATION_CONFIGURATION_INVALID"
  | "STAGE_FORMAT_NOT_SUPPORTED"
  | "ROUTING_PLAN_MISSING"
  | "STAGE_ALREADY_COMPLETED"
  | "STAGE_ALREADY_STARTED"
  | "MATCHES_ALREADY_EXIST"
  | "GROUPS_ALREADY_EXIST"
  | "RANKING_INCONSISTENT"
  | "STAGE_SEEDING_CONFIGURATION_INVALID"
  | "SEEDING_CEREMONY_REQUIRED"
  | "SEEDING_CEREMONY_INCOMPLETE"
  | "SEEDING_CEREMONY_STALE";

const ERROR_MESSAGES: Record<StageLifecycleErrorCode, string> = {
  TOURNAMENT_NOT_FOUND: "Turniej nie istnieje.",
  STAGE_NOT_FOUND: "Etap nie istnieje.",
  STAGE_NOT_ACTIVE: "Zakończyć można wyłącznie aktywny etap.",
  STAGE_NOT_NEXT_PLANNED: "Uruchomić można wyłącznie najbliższy zaplanowany etap.",
  ACTIVE_STAGE_EXISTS: "Inny etap turnieju jest już aktywny.",
  PREVIOUS_STAGE_NOT_COMPLETED: "Poprzedni etap nie został zakończony.",
  STAGE_INCOMPLETE: "Nie wszystkie wymagane mecze i rundy etapu są zakończone.",
  STAGE_PARTICIPANTS_INCONSISTENT: "Uczestnicy etapu są niespójni.",
  STAGE_BASKET_CONFIGURATION_INVALID:
    "Konfiguracja koszyków etapów jest niespójna.",
  QUALIFICATION_CONFIGURATION_INVALID: "Konfiguracja kwalifikacji między etapami jest niespójna.",
  STAGE_FORMAT_NOT_SUPPORTED: "Ten format etapu nie jest jeszcze obsługiwany przez lifecycle.",
  ROUTING_PLAN_MISSING: "Brak routing planu dla etapu Double Elimination. Skonfiguruj koszyki lub odtwórz turniej przez nowy kreator.",
  STAGE_ALREADY_COMPLETED: "Etap został już zakończony.",
  STAGE_ALREADY_STARTED: "Etap został już uruchomiony.",
  MATCHES_ALREADY_EXIST: "Planowany etap zawiera już mecze.",
  GROUPS_ALREADY_EXIST: "Planowany etap zawiera już grupy.",
  RANKING_INCONSISTENT: "Nie można wyliczyć jednoznacznego rankingu etapu.",
  STAGE_SEEDING_CONFIGURATION_INVALID: "Konfiguracja seedowania lub rozmieszczenia etapu jest niespójna.",
  SEEDING_CEREMONY_REQUIRED: "Przed uruchomieniem etapu trzeba przygotować i przeprowadzić zaplanowane losowanie.",
  SEEDING_CEREMONY_INCOMPLETE: "Losowanie nie zostało jeszcze w całości ujawnione.",
  SEEDING_CEREMONY_STALE: "Przygotowane losowanie nie odpowiada aktualnym uczestnikom lub ustawieniom etapu.",
};

export class StageLifecycleError extends Error {
  constructor(public readonly code: StageLifecycleErrorCode) {
    super(ERROR_MESSAGES[code]);
    this.name = "StageLifecycleError";
  }
}
