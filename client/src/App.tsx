import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Games from "@/pages/games";
import Profile from "@/pages/profile";
import Leaderboard from "@/pages/leaderboard";
import { Dice5, DollarSign, Home as HomeIcon, Trophy, User } from "lucide-react";
import { ThemeProvider } from "next-themes";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="bg-secondary py-4 px-6 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Dice5 className="text-accent text-2xl" />
            <Link href="/">
              <a className="font-game text-xl md:text-2xl tracking-wider">PIGLET CASINO BOT</a>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/">
              <a className="hover:text-accent transition">Home</a>
            </Link>
            <Link href="/games">
              <a className="hover:text-accent transition">Games</a>
            </Link>
            <Link href="/profile">
              <a className="hover:text-accent transition">Profile</a>
            </Link>
            <Link href="/leaderboard">
              <a className="hover:text-accent transition">Leaderboard</a>
            </Link>
          </div>
          <div className="md:hidden flex space-x-4">
            <Link href="/">
              <a className="text-xl hover:text-accent"><HomeIcon size={20} /></a>
            </Link>
            <Link href="/games">
              <a className="text-xl hover:text-accent"><Dice5 size={20} /></a>
            </Link>
            <Link href="/profile">
              <a className="text-xl hover:text-accent"><User size={20} /></a>
            </Link>
            <Link href="/leaderboard">
              <a className="text-xl hover:text-accent"><Trophy size={20} /></a>
            </Link>
          </div>
        </div>
      </nav>
      
      <main>
        {children}
      </main>
      
      <footer className="bg-background py-8 px-6 border-t border-secondary">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground mb-2">Piglet Gambling Bot - A virtual gambling experience</p>
          <p className="text-muted-foreground text-sm mb-4">All gambling is done with virtual currency only</p>
          <div className="flex justify-center space-x-4">
            <a href="#" className="text-muted-foreground hover:text-accent">
              <i className="fab fa-discord"></i>
            </a>
            <a href="#" className="text-muted-foreground hover:text-accent">
              <i className="fab fa-github"></i>
            </a>
            <a href="#" className="text-muted-foreground hover:text-accent">
              <i className="fab fa-twitter"></i>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/games" component={Games} />
        <Route path="/profile" component={Profile} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
