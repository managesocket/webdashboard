import { Dice5 } from "lucide-react";
import { Route, Switch, Link, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import MultiplierGamePage from "./pages/multiplier";
import { queryClient } from './lib/queryClient';

// App with routing
export default function App() {
  const [location] = useLocation();
  
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        <nav className="bg-secondary py-4 px-6 shadow-lg">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Link href="/">
                <a className="flex items-center gap-2">
                  <Dice5 className="text-accent text-2xl" />
                  <span className="text-xl md:text-2xl tracking-wider font-bold">PIGLET CASINO BOT</span>
                </a>
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/">
                <a className={`hover:text-accent transition ${location === '/' ? 'text-accent' : ''}`}>Home</a>
              </Link>
              <Link href="/multiplier">
                <a className={`hover:text-accent transition ${location === '/multiplier' ? 'text-accent' : ''}`}>Multiplier Game</a>
              </Link>
              <a href="#features" className="hover:text-accent transition">Features</a>
              <a href="#commands" className="hover:text-accent transition">Commands</a>
            </div>
          </div>
        </nav>
      
        <main>
          <Switch>
            <Route path="/multiplier">
              <MultiplierGamePage />
            </Route>
            <Route path="/">
              {/* Hero Section */}
              <section className="bg-gradient-to-br from-secondary to-background py-12 px-6">
                <div className="container mx-auto text-center">
                  <h1 className="text-4xl md:text-5xl mb-4 font-bold text-accent">PIGLET CASINO BOT</h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                    A virtual gambling experience with multiple games and leaderboards
                  </p>
                  
                  <div className="inline-block bg-secondary p-4 rounded-xl mb-8">
                    <div className="flex justify-center items-center space-x-3">
                      <span className="text-warning text-2xl font-mono">1,000</span>
                      <span className="text-muted-foreground">starting coins</span>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <Link href="/multiplier">
                      <a className="px-6 py-2 bg-accent text-white rounded-md hover:bg-accent/80">
                        Play Multiplier Game
                      </a>
                    </Link>
                  </div>
                </div>
              </section>

              {/* Game Previews Section */}
              <section id="games" className="py-12 px-6 bg-secondary">
                <div className="container mx-auto">
                  <h2 className="text-2xl mb-8 text-center font-bold">GAMES</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-background p-6 rounded-lg">
                      <h3 className="text-xl font-bold mb-4">Multiplier</h3>
                      <div className="flex justify-center p-6 bg-secondary rounded-lg">
                        <div className="w-16 h-16 bg-card rounded-lg flex flex-col items-center justify-center">
                          <span className="text-success text-lg">5.24x</span>
                          <span className="text-xs text-muted-foreground">MULTIPLIER</span>
                        </div>
                      </div>
                      <p className="mt-4 text-center text-muted-foreground">Cash out before it crashes!</p>
                      <div className="mt-4 text-center">
                        <Link href="/multiplier">
                          <a className="text-sm text-accent hover:underline">
                            Play Now
                          </a>
                        </Link>
                      </div>
                    </div>
                    
                    <div className="bg-background p-6 rounded-lg">
                      <h3 className="text-xl font-bold mb-4">Slot Machine</h3>
                      <div className="flex justify-center space-x-4 p-6 bg-secondary rounded-lg">
                        <div className="w-14 h-14 bg-card rounded-lg flex items-center justify-center">
                          <span className="text-warning text-xl">7</span>
                        </div>
                        <div className="w-14 h-14 bg-card rounded-lg flex items-center justify-center">
                          <span className="text-error text-xl">♦</span>
                        </div>
                        <div className="w-14 h-14 bg-card rounded-lg flex items-center justify-center">
                          <span className="text-warning text-xl">7</span>
                        </div>
                      </div>
                      <p className="mt-4 text-center text-muted-foreground">Match symbols to win big!</p>
                    </div>
                    
                    <div className="bg-background p-6 rounded-lg">
                      <h3 className="text-xl font-bold mb-4">Blackjack</h3>
                      <div className="flex justify-center space-x-4 p-6 bg-secondary rounded-lg">
                        <div className="w-12 h-16 bg-card rounded-lg flex items-center justify-center">
                          <span className="text-white">A♠</span>
                        </div>
                        <div className="w-12 h-16 bg-card rounded-lg flex items-center justify-center">
                          <span className="text-error">K♥</span>
                        </div>
                        <div className="w-12 h-16 bg-secondary border border-muted rounded-lg flex items-center justify-center">
                          <span className="text-primary text-xl">?</span>
                        </div>
                      </div>
                      <p className="mt-4 text-center text-muted-foreground">Try to get 21 without going over!</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Features Section */}
              <section id="features" className="py-12 px-6 bg-background">
                <div className="container mx-auto">
                  <h2 className="text-2xl mb-8 text-center font-bold">FEATURES</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    <div className="bg-card rounded-lg p-6 text-center">
                      <div className="mb-4 flex justify-center">
                        <Dice5 className="h-12 w-12 text-accent" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Multiple Games</h3>
                      <p className="text-muted-foreground">
                        Choose from exciting games including Multiplier, Blackjack, Slots, and Crash
                      </p>
                    </div>
                    
                    <div className="bg-card rounded-lg p-6 text-center">
                      <div className="mb-4 flex justify-center">
                        <span className="h-12 w-12 text-warning text-4xl">💰</span>
                      </div>
                      <h3 className="text-xl font-bold mb-2">Virtual Currency</h3>
                      <p className="text-muted-foreground">
                        Earn coins through daily rewards, working, and winning games
                      </p>
                    </div>
                    
                    <div className="bg-card rounded-lg p-6 text-center">
                      <div className="mb-4 flex justify-center">
                        <span className="h-12 w-12 text-warning text-4xl">🏆</span>
                      </div>
                      <h3 className="text-xl font-bold mb-2">Jackpots</h3>
                      <p className="text-muted-foreground">
                        Win massive jackpots that grow with every bet placed
                      </p>
                    </div>
                  </div>
                </div>
              </section>
              
              {/* Commands Section */}
              <section id="commands" className="py-12 px-6 bg-gradient-to-br from-secondary to-background">
                <div className="container mx-auto">
                  <h2 className="text-2xl mb-8 text-center font-bold">COMMANDS</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    <div className="bg-card p-6 rounded-lg">
                      <h3 className="text-lg font-bold mb-4 border-b border-secondary pb-2">Game Commands</h3>
                      <ul className="space-y-2">
                        <li className="flex justify-between">
                          <span className="text-accent">/multiplier</span>
                          <span className="text-muted-foreground">Play multiplier game</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-accent">/blackjack</span>
                          <span className="text-muted-foreground">Play blackjack</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-accent">/slots</span>
                          <span className="text-muted-foreground">Play slot machine</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-accent">/coinflip</span>
                          <span className="text-muted-foreground">Flip a coin</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-card p-6 rounded-lg">
                      <h3 className="text-lg font-bold mb-4 border-b border-secondary pb-2">Currency Commands</h3>
                      <ul className="space-y-2">
                        <li className="flex justify-between">
                          <span className="text-accent">/daily</span>
                          <span className="text-muted-foreground">Claim daily reward</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-accent">/work</span>
                          <span className="text-muted-foreground">Work for coins</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-accent">/jackpots</span>
                          <span className="text-muted-foreground">Check jackpot pools</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-accent">/freegames</span>
                          <span className="text-muted-foreground">View free games</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
            </Route>
          </Switch>
        </main>
        
        <footer className="bg-background py-8 px-6 border-t border-secondary">
          <div className="container mx-auto text-center">
            <p className="text-muted-foreground mb-2">Piglet Gambling Bot - A virtual gambling experience</p>
            <p className="text-muted-foreground text-sm mb-4">All gambling is done with virtual currency only</p>
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  );
}