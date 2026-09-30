import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/auth-context";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import FanView from "@/pages/fan-view";
import SupportEntry from "@/pages/support-entry";
import CreateTournament from "@/pages/create-tournament";
import TournamentCreateChoice from "@/pages/tournament-create-choice";
import CreateTournamentExperimental from "@/pages/experimental/tournaments/create-tournament-experimental";
import TournamentDetail from "@/pages/tournament-detail";
import TournamentBracket from "@/pages/tournament-bracket";
import TournamentHost from "@/pages/tournament-host";
import TournamentAudience from "@/pages/tournament-audience";
import TournamentProjector from "@/pages/tournament-projector";
import HelpPage from "@/pages/help";
import TournamentsHome from "@/pages/tournaments-home";
import MinigamesPage from "@/pages/minigames";
import EvolutionPrototypePage from "@/pages/evolution-prototype";
import RandomizersPage from "@/pages/randomizers";
import RandomizerProperPage from "@/pages/randomizer-proper";
import WheelPrototypePage from "@/pages/randomizer-prototype-wheel";
import PinballPrototypePage from "@/pages/randomizer-prototype-pinball";
import CardsPrototypePage from "@/pages/randomizer-prototype-cards";
import LudologyPage from "@/pages/ludology";
import StatementClassificationPage from "@/pages/statement-classification";
import GameCatalogAdminPage from "@/pages/game-catalog-admin";
import StreamPage from "@/pages/stream";
import MetaLabPage from "@/pages/meta-lab";
import ResearchPage from "@/pages/research";
import VenediResearchPage from "@/pages/venedi-research";
import VenediDatabasePage from "@/pages/venedi-database";
import VenediMapPage from "@/pages/venedi-map";
import SfPage from "@/pages/sf";
import CameraChatOverlay from "@/features/streaming/obs-lab/CameraChatOverlay";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />

      <Route path="/minigames" component={MinigamesPage} />

      <Route path="/minigames/evolution" component={EvolutionPrototypePage} />

      <Route path="/randomizers" component={RandomizersPage} />

      <Route path="/randomizers/cards" component={RandomizerProperPage} />

      <Route path="/randomizers/prototypes/wheel" component={WheelPrototypePage} />

      <Route path="/randomizers/prototypes/pinball" component={PinballPrototypePage} />

      <Route path="/randomizers/prototypes/cards" component={CardsPrototypePage} />

      <Route path="/ludology" component={LudologyPage} />

      <Route path="/ludology/game-classification" component={GameCatalogAdminPage} />

      <Route path="/ludology/game-classification/search" component={GameCatalogAdminPage} />

      <Route path="/ludology/game-classification/games" component={GameCatalogAdminPage} />

      <Route path="/ludology/game-classification/games/:id" component={GameCatalogAdminPage} />

      <Route path="/ludology/game-classification/gameplay" component={GameCatalogAdminPage} />

      <Route path="/ludology/game-classification/mode" component={GameCatalogAdminPage} />

      <Route path="/ludology/game-classification/structure" component={GameCatalogAdminPage} />

      <Route path="/ludology/game-classification/world" component={GameCatalogAdminPage} />

      <Route path="/ludology/game-classification/visual" component={GameCatalogAdminPage} />

      <Route path="/ludology/game-classification/methodology" component={GameCatalogAdminPage} />

      <Route path="/ludology/game-classification/why" component={GameCatalogAdminPage} />

      <Route path="/ludology/statement-classification" component={StatementClassificationPage} />

      <Route path="/ludology/statement-classification/people" component={StatementClassificationPage} />

      <Route path="/ludology/statement-classification/sources" component={StatementClassificationPage} />

      <Route path="/ludology/statement-classification/fragments" component={StatementClassificationPage} />

      <Route path="/ludology/statement-classification/coding" component={StatementClassificationPage} />

      <Route path="/ludology/statement-classification/positions" component={StatementClassificationPage} />

      <Route path="/ludology/statement-classification/dimensions" component={StatementClassificationPage} />

      <Route path="/ludology/statement-classification/methodology" component={StatementClassificationPage} />

      <Route path="/sf" component={SfPage} />

      <Route path="/stream" component={StreamPage} />

      <Route path="/stream/overlay/camera-chat" component={CameraChatOverlay} />

      <Route path="/research" component={ResearchPage} />

      <Route path="/research/venedi" component={VenediResearchPage} />

      <Route path="/research/venedi/database" component={VenediDatabasePage} />

      <Route path="/research/venedi/map" component={VenediMapPage} />

      <Route path="/meta-lab" component={MetaLabPage} />
      <Route path="/dashboard" component={Dashboard} />

      <Route path="/fan" component={FanView} />
      <Route path="/support" component={SupportEntry} />
      <Route path="/tournaments/create" component={TournamentCreateChoice} />
      <Route path="/experimental/tournaments/create" component={CreateTournamentExperimental} />
      <Route path="/experimental/tournaments/new" component={CreateTournamentExperimental} />
      <Route path="/experimental/tournaments/dashboard" component={Dashboard} />
      <Route path="/experimental/tournaments/support" component={SupportEntry} />
      <Route path="/experimental/tournaments/fan" component={FanView} />
      <Route path="/experimental/tournaments/:id/bracket" component={TournamentBracket} />
      <Route path="/experimental/tournaments/:id/host" component={TournamentHost} />
      <Route path="/experimental/tournaments/:id/audience" component={TournamentAudience} />
      <Route path="/experimental/tournaments/:id/projector" component={TournamentProjector} />
      <Route path="/experimental/tournaments/:id" component={TournamentDetail} />
      <Route path="/experimental/tournaments" component={TournamentsHome} />
      <Route path="/tournaments/new" component={CreateTournament} />
      <Route path="/tournaments/:id/bracket" component={TournamentBracket} />
      <Route path="/tournaments/:id/host" component={TournamentHost} />
      <Route path="/tournaments/:id/audience" component={TournamentAudience} />
      <Route path="/tournaments/:id/projector" component={TournamentProjector} />
      <Route path="/tournaments/:id" component={TournamentDetail} />

      <Route path="/ludology/statement-classification/overview" component={StatementClassificationPage} />

      <Route path="/ludology/statement-classification/map" component={StatementClassificationPage} />

      <Route path="/tournaments" component={TournamentsHome} />

      <Route path="/developer/overlay/camera-chat" component={CameraChatOverlay} />

      <Route path="/help" component={HelpPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
