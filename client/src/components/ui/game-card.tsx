import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Dice5, CreditCard, Coins, Dice3, RotateCw, CircleDollarSign } from "lucide-react";

type GameCardProps = {
  name: string;
  description: string;
  minBet: number;
  icon: 'blackjack' | 'coinflip' | 'crash' | 'slots' | 'roulette' | 'dice';
  onPlay: () => void;
};

const getGameIcon = (icon: string) => {
  switch (icon) {
    case 'blackjack':
      return <CreditCard className="text-accent" />;
    case 'coinflip':
      return <Coins className="text-warning" />;
    case 'crash':
      return <RotateCw className="text-error" />;
    case 'slots':
      return <Dice3 className="text-success" />;
    case 'roulette':
      return <CircleDollarSign className="text-info" />;
    case 'dice':
      return <Dice5 className="text-accent" />;
    default:
      return <Dice5 className="text-accent" />;
  }
};

export function GameCard({ name, description, minBet, icon, onPlay }: GameCardProps) {
  return (
    <Card className="game-card overflow-hidden shadow-lg h-full bg-card hover:shadow-xl">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-xl">{name}</h3>
          {getGameIcon(icon)}
        </div>
        <p className="text-muted-foreground mb-6">{description}</p>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Min Bet: <span className="text-warning">{minBet}</span></span>
          <Button 
            variant="default" 
            className="bg-accent hover:bg-accent/80" 
            onClick={onPlay}
          >
            Play Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
