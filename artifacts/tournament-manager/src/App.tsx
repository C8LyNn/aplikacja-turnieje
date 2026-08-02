import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/auth-context";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import DeveloperPage from "@/pages/developer";
import FanView from "@/pages/fan-view";
import SupportEntry from "@/pages/support-entry";
import CreateTournament from "@/pages/create-tournament";
import TournamentDetail from "@/pages/tournament-detail";
import TournamentBracket from "@/pages/tournament-bracket";
import TournamentHost from "@/pages/tournament-host";
import TournamentAudience from "@/pages/tournament-audience";
import HelpPage from "@/pages/help";

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
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/developer" component={DeveloperPage} />
      <Route path="/fan" component={FanView} />
      <Route path="/support" component={SupportEntry} />
      <Route path="/tournaments/new" component={CreateTournament} />
      <Route path="/tournaments/:id/bracket" component={TournamentBracket} />
      <Route path="/tournaments/:id/host" component={TournamentHost} />
      <Route path="/tournaments/:id/audience" component={TournamentAudience} />
      <Route path="/tournaments/:id" component={TournamentDetail} />
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
