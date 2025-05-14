import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CommandsList, getAllCommands } from "@/components/ui/commands-list";
import { Dice5, Trophy, User, Coins } from "lucide-react";

export default function Home() {
  const { gameCommands, currencyCommands } = getAllCommands();

  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-secondary to-background py-12 px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl mb-4 font-bold text-accent">PIGLET CASINO BOT</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Play games, earn virtual currency, and compete on the leaderboard!
          </p>
          
          <div className="inline-block bg-secondary p-4 rounded-xl mb-8">
            <div className="flex justify-center items-center space-x-3">
              <span className="text-warning text-2xl font-mono">1,000</span>
              <span className="text-muted-foreground">coins</span>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link href="/games">
              <a>
                <Button className="bg-accent hover:bg-accent/80 text-white">
                  <Dice5 className="mr-2 h-4 w-4" /> Play Games
                </Button>
              </a>
            </Link>
            <Link href="/profile">
              <a>
                <Button variant="outline">
                  <User className="mr-2 h-4 w-4" /> View Profile
                </Button>
              </a>
            </Link>
            <Link href="/leaderboard">
              <a>
                <Button variant="outline">
                  <Trophy className="mr-2 h-4 w-4" /> Leaderboard
                </Button>
              </a>
            </Link>
          </div>
        </div>
      </section>

      {/* Commands Section */}
      <section id="commands" className="py-12 px-6">
        <div className="container mx-auto">
          <h2 className="text-2xl mb-8 text-center font-bold">COMMANDS</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <CommandsList 
              title="Game Commands" 
              commands={gameCommands}
            />
            
            <CommandsList 
              title="Currency Commands" 
              commands={currencyCommands}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 px-6 bg-gradient-to-br from-secondary to-background">
        <div className="container mx-auto">
          <h2 className="text-2xl mb-8 text-center font-bold">FEATURES</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-card rounded-lg p-6 text-center">
              <div className="mb-4 flex justify-center">
                <Dice5 className="h-12 w-12 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-2">Multiple Games</h3>
              <p className="text-muted-foreground">
                Choose from six exciting games including Blackjack, Slots, and Crash
              </p>
            </div>
            
            <div className="bg-card rounded-lg p-6 text-center">
              <div className="mb-4 flex justify-center">
                <Coins className="h-12 w-12 text-warning" />
              </div>
              <h3 className="text-xl font-bold mb-2">Virtual Currency</h3>
              <p className="text-muted-foreground">
                Earn coins through daily rewards, working, and winning games
              </p>
            </div>
            
            <div className="bg-card rounded-lg p-6 text-center">
              <div className="mb-4 flex justify-center">
                <Trophy className="h-12 w-12 text-warning" />
              </div>
              <h3 className="text-xl font-bold mb-2">Leaderboards</h3>
              <p className="text-muted-foreground">
                Compete with others to reach the top of the leaderboard
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Game Previews Section */}
      <section className="py-12 px-6 bg-secondary">
        <div className="container mx-auto">
          <h2 className="text-2xl mb-8 text-center font-bold">GAME PREVIEWS</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-background p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-4">Slot Machine</h3>
              <div className="flex justify-center space-x-4 p-6 bg-secondary rounded-lg">
                <div className="w-16 h-16 bg-card rounded-lg flex items-center justify-center">
                  <span className="text-warning text-2xl">7</span>
                </div>
                <div className="w-16 h-16 bg-card rounded-lg flex items-center justify-center">
                  <span className="text-error text-2xl">♦</span>
                </div>
                <div className="w-16 h-16 bg-card rounded-lg flex items-center justify-center">
                  <span className="text-warning text-2xl">7</span>
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
    </div>
  );
}
