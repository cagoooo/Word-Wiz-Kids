import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Navbar } from '@/components/layout/Navbar';

import Home from '@/pages/Home';
import Learn from '@/pages/Learn';
import Game from '@/pages/Game';
import Leaderboard from '@/pages/Leaderboard';
import Admin from '@/pages/Admin';

import { SwUpdateBanner } from '@/components/SwUpdateBanner';

const queryClient = new QueryClient();

function Router() {
  return (
    <>
      <Navbar />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/learn" component={Learn} />
        <Route path="/game" component={Game} />
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
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
        <SwUpdateBanner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
