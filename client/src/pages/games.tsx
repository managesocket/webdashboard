import { useState } from "react";
import { GameCard } from "@/components/ui/game-card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { BlackjackGame } from "@/components/ui/blackjack-game";
import { SlotMachine } from "@/components/ui/slot-machine";

export default function Games() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  
  const handlePlayGame = (game: string) => {
    setSelectedGame(game);
  };
  
  const handleCloseGame = () => {
    setSelectedGame(null);
  };
  
  const games = [
    {
      name: "Blackjack",
      description: "Beat the dealer by getting closer to 21 without going over.",
      minBet: 50,
      icon: "blackjack"
    },
    {
      name: "Coinflip",
      description: "Pick heads or tails and double your bet if you win.",
      minBet: 10,
      icon: "coinflip"
    },
    {
      name: "Crash",
      description: "Cash out before the multiplier crashes for big wins.",
      minBet: 25,
      icon: "crash"
    },
    {
      name: "Slots",
      description: "Spin the reels and match symbols for various payouts.",
      minBet: 20,
      icon: "slots"
    },
    {
      name: "Roulette",
      description: "Bet on numbers, colors, or sections and spin the wheel.",
      minBet: 15,
      icon: "roulette"
    },
    {
      name: "Dice",
      description: "Roll higher than the target number to win your bet.",
      minBet: 5,
      icon: "dice"
    }
  ];
  
  // Helper function to render the appropriate game component
  const renderGameComponent = () => {
    switch (selectedGame) {
      case "Blackjack":
        return <BlackjackGame onClose={handleCloseGame} />;
      case "Slots":
        return <SlotMachine />;
      // Other games would be implemented here
      default:
        return (
          <div className="p-6 text-center">
            <h3 className="text-xl font-bold mb-4">{selectedGame}</h3>
            <p className="text-muted-foreground mb-4">
              This game is coming soon to the web interface.
            </p>
            <p className="text-sm">
              You can play this game using the Discord bot with the command:
              <span className="font-mono bg-background px-2 py-1 rounded mx-2 text-accent">
                /{selectedGame?.toLowerCase()}
              </span>
            </p>
          </div>
        );
    }
  };
  
  return (
    <div>
      <section className="py-12 px-6">
        <div className="container mx-auto">
          <h2 className="font-game text-2xl mb-8 text-center">GAMES</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game, index) => (
              <GameCard
                key={index}
                name={game.name}
                description={game.description}
                minBet={game.minBet}
                icon={game.icon as any}
                onPlay={() => handlePlayGame(game.name)}
              />
            ))}
          </div>
        </div>
      </section>
      
      <Dialog open={!!selectedGame} onOpenChange={(open) => !open && handleCloseGame()}>
        <DialogContent className="max-w-4xl p-0 bg-background">
          {renderGameComponent()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
