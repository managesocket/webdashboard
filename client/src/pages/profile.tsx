import { useState, useEffect } from "react";
import { ProfileCard } from "@/components/ui/profile-card";
import { GameTransaction } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  
  // Demo user and stats data
  const [userData, setUserData] = useState({
    id: 6,
    username: "JohnPlayer",
    discordId: "678901234",
    balance: 1000,
    joinDate: new Date("2023-03-15"),
    avatarUrl: undefined,
  });
  
  const [statsData, setStatsData] = useState({
    id: 6,
    userId: 6,
    gamesPlayed: 42,
    gamesWon: 18,
    gamesLost: 24,
    totalWagered: 2100,
    totalWon: 1800,
    totalLost: 2300,
    highestWin: 520,
    highestLoss: 200,
    favoriteGame: "blackjack",
    lastPlayed: new Date(),
  });
  
  const [transactions, setTransactions] = useState<GameTransaction[]>([
    {
      id: 1,
      userId: 6,
      gameType: "crash",
      betAmount: 100,
      outcome: "win",
      winAmount: 520,
      timestamp: new Date(Date.now() - 3600000),
      gameDetails: JSON.stringify({ crashPoint: 5.2, cashoutMultiplier: 5.2 }),
    },
    {
      id: 2,
      userId: 6,
      gameType: "slots",
      betAmount: 50,
      outcome: "win",
      winAmount: 300,
      timestamp: new Date(Date.now() - 7200000),
      gameDetails: JSON.stringify({ symbols: ["sseven", "sseven", "sseven"], matchType: "triple" }),
    },
    {
      id: 3,
      userId: 6,
      gameType: "blackjack",
      betAmount: 100,
      outcome: "win",
      winAmount: 200,
      timestamp: new Date(Date.now() - 10800000),
      gameDetails: JSON.stringify({ outcome: "win" }),
    },
    {
      id: 4,
      userId: 6,
      gameType: "coinflip",
      betAmount: 50,
      outcome: "loss",
      winAmount: 0,
      timestamp: new Date(Date.now() - 14400000),
      gameDetails: JSON.stringify({ playerChoice: "heads", result: "tails" }),
    },
    {
      id: 5,
      userId: 6,
      gameType: "roulette",
      betAmount: 100,
      outcome: "loss",
      winAmount: 0,
      timestamp: new Date(Date.now() - 18000000),
      gameDetails: JSON.stringify({ spinResult: 0, betType: "color", betValue: "red" }),
    },
  ]);
  
  // Calculate favorite games
  const favoriteGames = [
    { name: "Blackjack", count: 16 },
    { name: "Slots", count: 12 },
    { name: "Coinflip", count: 8 },
    { name: "Crash", count: 4 },
    { name: "Roulette", count: 2 },
  ];
  
  // Calculate biggest wins
  const biggestWins = [
    { game: "Crash (x5.2)", amount: 520 },
    { game: "Slots (Triple 7's)", amount: 300 },
    { game: "Blackjack", amount: 200 },
  ];
  
  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  const formatGameType = (type: string): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };
  
  const formatTimestamp = (timestamp: Date): string => {
    return new Date(timestamp).toLocaleString();
  };
  
  const formatGameDetails = (gameType: string, details: string): string => {
    try {
      const parsedDetails = JSON.parse(details);
      
      switch (gameType) {
        case "crash":
          return `Crashed at ${parsedDetails.crashPoint?.toFixed(2)}x`;
        case "slots":
          return parsedDetails.matchType === "triple" ? "Triple match!" : "No match";
        case "coinflip":
          return `${parsedDetails.playerChoice} vs ${parsedDetails.result}`;
        case "blackjack":
          return parsedDetails.outcome;
        case "roulette":
          return `Landed on ${parsedDetails.spinResult}`;
        case "dice":
          return `Rolled ${parsedDetails.roll}`;
        default:
          return "";
      }
    } catch (e) {
      return "";
    }
  };
  
  return (
    <div className="py-12 px-6 bg-gradient-to-br from-secondary to-background">
      <div className="container mx-auto">
        <h2 className="font-game text-2xl mb-8 text-center">YOUR PROFILE</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse text-lg">Loading profile...</div>
          </div>
        ) : (
          <>
            <ProfileCard 
              user={userData}
              stats={statsData}
              favoriteGames={favoriteGames}
              biggestWins={biggestWins}
            />
            
            <div className="mt-12">
              <Tabs defaultValue="transactions" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
                  <TabsTrigger value="statistics">Detailed Statistics</TabsTrigger>
                </TabsList>
                <TabsContent value="transactions">
                  <Card>
                    <CardHeader>
                      <CardTitle>Transaction History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Game</th>
                              <th className="text-left py-2">Time</th>
                              <th className="text-left py-2">Bet</th>
                              <th className="text-left py-2">Outcome</th>
                              <th className="text-left py-2">Details</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions.map((tx) => (
                              <tr key={tx.id} className="border-b hover:bg-secondary/50">
                                <td className="py-3">{formatGameType(tx.gameType)}</td>
                                <td className="py-3">{formatTimestamp(tx.timestamp)}</td>
                                <td className="py-3 font-mono">{tx.betAmount}</td>
                                <td className={`py-3 ${tx.outcome === 'win' ? 'text-success' : 'text-error'}`}>
                                  {tx.outcome === 'win' 
                                    ? `+${tx.winAmount}` 
                                    : `-${tx.betAmount}`}
                                </td>
                                <td className="py-3">{formatGameDetails(tx.gameType, tx.gameDetails || "")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="statistics">
                  <Card>
                    <CardHeader>
                      <CardTitle>Game Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-medium mb-2">Overall Stats</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between py-1 border-b border-border">
                              <span>Total Wagered:</span>
                              <span className="font-mono">{statsData.totalWagered}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-border">
                              <span>Total Won:</span>
                              <span className="font-mono text-success">{statsData.totalWon}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-border">
                              <span>Total Lost:</span>
                              <span className="font-mono text-error">{statsData.totalLost}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-border">
                              <span>Net Profit:</span>
                              <span className={`font-mono ${statsData.totalWon - statsData.totalLost >= 0 ? 'text-success' : 'text-error'}`}>
                                {statsData.totalWon - statsData.totalLost}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-medium mb-2">Performance Metrics</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between py-1 border-b border-border">
                              <span>Win Rate:</span>
                              <span className="font-mono">
                                {statsData.gamesPlayed 
                                  ? ((statsData.gamesWon / statsData.gamesPlayed) * 100).toFixed(1) 
                                  : 0}%
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-border">
                              <span>Average Bet:</span>
                              <span className="font-mono">
                                {statsData.gamesPlayed 
                                  ? Math.round(statsData.totalWagered / statsData.gamesPlayed) 
                                  : 0}
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-border">
                              <span>Highest Win:</span>
                              <span className="font-mono text-success">{statsData.highestWin}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-border">
                              <span>Highest Loss:</span>
                              <span className="font-mono text-error">{statsData.highestLoss}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
