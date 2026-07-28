import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Route, Switch, Router as WouterRouter } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { Navbar } from "@/components/layout/Navbar";

import Home from "@/pages/Home";
import Learn from "@/pages/Learn";
import Mistakes from "@/pages/Mistakes";
import Game from "@/pages/Game";
import Leaderboard from "@/pages/Leaderboard";
import Admin from "@/pages/Admin";
import ArenaHost from "@/pages/ArenaHost";
import ArenaPlayer from "@/pages/ArenaPlayer";
import PhotoScan from "@/pages/PhotoScan";
import ListenQuiz from "@/pages/ListenQuiz";

import { SwUpdateBanner } from "@/components/SwUpdateBanner";
import { HeroProfileGate } from "@/components/student/HeroProfileGate";
import { BadgeUnlockNotifier } from "@/components/gamification/BadgeUnlockNotifier";

const queryClient = new QueryClient();

function Router() {
  return (
    <>
      <Navbar />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/learn" component={Learn} />
        <Route path="/mistakes" component={Mistakes} />
        <Route path="/game">
          <HeroProfileGate>
            <Game />
          </HeroProfileGate>
        </Route>
        <Route path="/arena/host" component={ArenaHost} />
        <Route path="/arena/player">
          <HeroProfileGate>
            <ArenaPlayer />
          </HeroProfileGate>
        </Route>
        <Route path="/photo-scan" component={PhotoScan} />
        <Route path="/listen-quiz">
          <HeroProfileGate>
            <ListenQuiz />
          </HeroProfileGate>
        </Route>
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter hook={useHashLocation}>
          <Router />
        </WouterRouter>
        <BadgeUnlockNotifier />
        <Toaster />
        <SwUpdateBanner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
