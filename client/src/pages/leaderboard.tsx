import { useState, useEffect } from "react";
import { Leaderboard as LeaderboardComponent } from "@/components/ui/leaderboard";
import { CasinoCard } from "@/components/ui/casino-card";
import { Coins, Trophy, BarChart3 } from "lucide-react";

export default function Leaderboard() {
  const [loading, setLoading] = useState(true);
  
  // Demo leaderboard entries
  const balanceEntries = [
    {
      position: 1,
      user: { id: 1, username: "WhaleMaster", discordId: "123456789", avatarUrl: undefined },
      value: 8245,
      stats: { gamesWon: 86, gamesLost: 52 }
    },
    {
      position: 2,
      user: { id: 2, username: "LuckyDragon", discordId: "234567890", avatarUrl: undefined },
      value: 6125,
      stats: { gamesWon: 64, gamesLost: 27 }
    },
    {
      position: 3,
      user: { id: 3, username: "GambleKing", discordId: "345678901", avatarUrl: undefined },
      value: 5780,
      stats: { gamesWon: 72, gamesLost: 68 }
    },
    {
      position: 4,
      user: { id: 4, username: "CasinoQueen", discordId: "456789012", avatarUrl: undefined },
      value: 4230,
      stats: { gamesWon: 53, gamesLost: 41 }
    },
    {
      position: 5,
      user: { id: 5, username: "JackpotHunter", discordId: "567890123", avatarUrl: undefined },
      value: 3870,
      stats: { gamesWon: 47, gamesLost: 39 }
    },
    {
      position: 12,
      user: { id: 6, username: "JohnPlayer", discordId: "678901234", avatarUrl: undefined },
      value: 1000,
      stats: { gamesWon: 18, gamesLost: 24 }
    },
  ];
  
  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Simulate tab change
  const handleTabChange = async (tab: 'balance' | 'wins' | 'winrate') => {
    setLoading(true);
    
    // In a real app, this would be an API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setLoading(false);
    
    if (tab === 'balance') {
      return balanceEntries;
    } else if (tab === 'wins') {
      // Sort by most wins
      return [
        {
          position: 1,
          user: { id: 1, username: "WhaleMaster", discordId: "123456789", avatarUrl: undefined },
          value: 86,
          stats: { gamesWon: 86, gamesLost: 52 }
        },
        {
          position: 2,
          user: { id: 3, username: "GambleKing", discordId: "345678901", avatarUrl: undefined },
          value: 72,
          stats: { gamesWon: 72, gamesLost: 68 }
        },
        {
          position: 3,
          user: { id: 2, username: "LuckyDragon", discordId: "234567890", avatarUrl: undefined },
          value: 64,
          stats: { gamesWon: 64, gamesLost: 27 }
        },
        {
          position: 4,
          user: { id: 4, username: "CasinoQueen", discordId: "456789012", avatarUrl: undefined },
          value: 53,
          stats: { gamesWon: 53, gamesLost: 41 }
        },
        {
          position: 5,
          user: { id: 5, username: "JackpotHunter", discordId: "567890123", avatarUrl: undefined },
          value: 47,
          stats: { gamesWon: 47, gamesLost: 39 }
        },
      ];
    } else {
      // Win rate
      return [
        {
          position: 1,
          user: { id: 2, username: "LuckyDragon", discordId: "234567890", avatarUrl: undefined },
          value: 70,
          stats: { gamesWon: 64, gamesLost: 27, winRate: 70 }
        },
        {
          position: 2,
          user: { id: 4, username: "CasinoQueen", discordId: "456789012", avatarUrl: undefined },
          value: 56,
          stats: { gamesWon: 53, gamesLost: 41, winRate: 56 }
        },
        {
          position: 3,
          user: { id: 5, username: "JackpotHunter", discordId: "567890123", avatarUrl: undefined },
          value: 55,
          stats: { gamesWon: 47, gamesLost: 39, winRate: 55 }
        },
        {
          position: 4,
          user: { id: 1, username: "WhaleMaster", discordId: "123456789", avatarUrl: undefined },
          value: 62,
          stats: { gamesWon: 86, gamesLost: 52, winRate: 62 }
        },
        {
          position: 5,
          user: { id: 3, username: "GambleKing", discordId: "345678901", avatarUrl: undefined },
          value: 51,
          stats: { gamesWon: 72, gamesLost: 68, winRate: 51 }
        },
      ];
    }
  };
  
  return (
    <div className="py-12 px-6 bg-gradient-to-br from-secondary to-background">
      <div className="container mx-auto">
        <h2 className="font-game text-2xl mb-8 text-center">PIGLET GAMBLING RANKINGS</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-3">
            <LeaderboardComponent 
              initialEntries={balanceEntries}
              onTabChange={handleTabChange}
            />
          </div>
          
          <div className="space-y-6">
            <CasinoCard 
              title="How to Compete"
              description="Play games and win coins to climb the leaderboard!"
              icon={<Trophy className="text-warning" />}
            >
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <span className="bg-background p-1 rounded mr-2 text-primary">1.</span>
                  Start with 1,000 free coins
                </li>
                <li className="flex items-center">
                  <span className="bg-background p-1 rounded mr-2 text-primary">2.</span>
                  Use /daily and /work commands
                </li>
                <li className="flex items-center">
                  <span className="bg-background p-1 rounded mr-2 text-primary">3.</span>
                  Play games and win big
                </li>
                <li className="flex items-center">
                  <span className="bg-background p-1 rounded mr-2 text-primary">4.</span>
                  Check rankings with /leaderboard
                </li>
              </ul>
            </CasinoCard>
            
            <CasinoCard 
              title="Top Winners"
              description="Players with the most wins this week"
              icon={<BarChart3 className="text-success" />}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center">
                    <span className="bg-warning text-white w-5 h-5 rounded-full flex items-center justify-center mr-2">1</span>
                    WhaleMaster
                  </span>
                  <span className="text-success">86 wins</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center">
                    <span className="bg-neutral-500 text-white w-5 h-5 rounded-full flex items-center justify-center mr-2">2</span>
                    GambleKing
                  </span>
                  <span className="text-success">72 wins</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center">
                    <span className="bg-amber-600 bg-opacity-70 text-white w-5 h-5 rounded-full flex items-center justify-center mr-2">3</span>
                    LuckyDragon
                  </span>
                  <span className="text-success">64 wins</span>
                </div>
              </div>
            </CasinoCard>
            
            <CasinoCard 
              title="Rewards"
              description="Special rewards for top players"
              icon={<Coins className="text-warning" />}
            >
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Weekly Winner</span>
                  <span className="font-mono text-warning">+5,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Champion</span>
                  <span className="font-mono text-warning">+25,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Jackpot Contributor</span>
                  <span className="font-mono text-warning">+1% bonus</span>
                </div>
              </div>
            </CasinoCard>
          </div>
        </div>
      </div>
    </div>
  );
}
