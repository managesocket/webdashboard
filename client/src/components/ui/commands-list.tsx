import { Card, CardContent, CardHeader, CardTitle } from "./card";

type Command = {
  name: string;
  description: string;
};

type CommandsListProps = {
  title: string;
  commands: Command[];
};

export function CommandsList({ title, commands }: CommandsListProps) {
  return (
    <Card className="bg-secondary rounded-xl">
      <CardHeader>
        <CardTitle className="font-bold text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {commands.map((command, index) => (
            <li key={index} className="flex items-start">
              <span className="font-mono bg-background px-2 py-1 rounded mr-3 text-accent">
                {command.name}
              </span>
              <span className="text-muted-foreground">{command.description}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function getAllCommands() {
  const gameCommands: Command[] = [
    { name: "/blackjack", description: "Play a game of blackjack" },
    { name: "/coinflip", description: "Flip a coin and bet on the outcome" },
    { name: "/crash", description: "Play the crash game" },
    { name: "/slots", description: "Play the slot machine" },
    { name: "/roulette", description: "Spin the roulette wheel" },
    { name: "/dice", description: "Roll the dice" },
  ];

  const currencyCommands: Command[] = [
    { name: "/daily", description: "Claim your daily coins (Cooldown: 24h)" },
    { name: "/work", description: "Work for coins (Cooldown: 1h)" },
    { name: "/balance", description: "Check your coin balance" },
    { name: "/give", description: "Give coins to another user" },
    { name: "/profile", description: "View your gambling profile" },
    { name: "/leaderboard", description: "See the richest players" },
  ];

  return { gameCommands, currencyCommands };
}
