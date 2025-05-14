import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Avatar, AvatarFallback } from './avatar';
import { User } from '@shared/schema';

type LeaderboardEntry = {
  position: number;
  user: {
    id: number;
    username: string;
    discordId: string;
    avatarUrl?: string;
  };
  value: number;
  stats?: {
    gamesWon: number;
    gamesLost: number;
    winRate?: number;
  };
};

type LeaderboardProps = {
  initialEntries?: LeaderboardEntry[];
  onTabChange?: (tab: 'balance' | 'wins' | 'winrate') => Promise<LeaderboardEntry[]>;
};

export function Leaderboard({ initialEntries = [], onTabChange }: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState<'balance' | 'wins' | 'winrate'>('balance');
  const [entries, setEntries] = useState<LeaderboardEntry[]>(initialEntries);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null); // For highlighting the current user
  
  const handleTabChange = async (tab: 'balance' | 'wins' | 'winrate') => {
    if (activeTab === tab) return;
    
    setLoading(true);
    setActiveTab(tab);
    
    if (onTabChange) {
      try {
        const newEntries = await onTabChange(tab);
        setEntries(newEntries);
      } catch (error) {
        console.error('Failed to load leaderboard data:', error);
      }
    } else {
      // Demo data
      setTimeout(() => {
        const demoEntries = generateDemoEntries(tab);
        setEntries(demoEntries);
        setLoading(false);
      }, 500);
    }
    
    setLoading(false);
  };
  
  const generateDemoEntries = (tab: 'balance' | 'wins' | 'winrate'): LeaderboardEntry[] => {
    const users = [
      { id: 1, username: 'WhaleMaster', discordId: '123456789', avatarUrl: undefined },
      { id: 2, username: 'LuckyDragon', discordId: '234567890', avatarUrl: undefined },
      { id: 3, username: 'GambleKing', discordId: '345678901', avatarUrl: undefined },
      { id: 4, username: 'CasinoQueen', discordId: '456789012', avatarUrl: undefined },
      { id: 5, username: 'JackpotHunter', discordId: '567890123', avatarUrl: undefined },
      { id: 6, username: 'JohnPlayer', discordId: '678901234', avatarUrl: undefined },
      { id: 7, username: 'SlotMaster', discordId: '789012345', avatarUrl: undefined },
      { id: 8, username: 'PigletFan', discordId: '890123456', avatarUrl: undefined },
      { id: 9, username: 'RoyalFlush', discordId: '901234567', avatarUrl: undefined },
      { id: 10, username: 'BlackjackPro', discordId: '012345678', avatarUrl: undefined },
    ];
    
    if (tab === 'balance') {
      return users.map((user, index) => ({
        position: index + 1,
        user,
        value: 10000 - index * 800 + Math.floor(Math.random() * 500),
        stats: {
          gamesWon: 50 - index * 3 + Math.floor(Math.random() * 20),
          gamesLost: 30 + index * 2 + Math.floor(Math.random() * 15),
        }
      }));
    } else if (tab === 'wins') {
      // Sort by most wins
      return [...users]
        .sort((a, b) => (100 - a.id * 5) - (100 - b.id * 5))
        .map((user, index) => {
          const wins = 100 - index * 5 - Math.floor(Math.random() * 10);
          return {
            position: index + 1,
            user,
            value: wins,
            stats: {
              gamesWon: wins,
              gamesLost: 30 + Math.floor(Math.random() * 40),
            }
          };
        });
    } else {
      // Sort by win rate
      return [...users]
        .sort((a, b) => (0.8 - a.id * 0.05) - (0.8 - b.id * 0.05))
        .map((user, index) => {
          const winRate = Math.round((0.8 - index * 0.05) * 100);
          const gamesWon = 50 + Math.floor(Math.random() * 30);
          const total = Math.floor(gamesWon / (winRate / 100));
          const gamesLost = total - gamesWon;
          
          return {
            position: index + 1,
            user,
            value: winRate,
            stats: {
              gamesWon,
              gamesLost,
              winRate,
            }
          };
        });
    }
  };
  
  const getValueLabel = () => {
    switch (activeTab) {
      case 'balance': return 'Coins';
      case 'wins': return 'Wins';
      case 'winrate': return 'Win Rate';
      default: return '';
    }
  };
  
  const formatValue = (value: number) => {
    if (activeTab === 'winrate') {
      return `${value}%`;
    }
    return value.toLocaleString();
  };
  
  const getInitials = (name: string) => {
    return name.split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };
  
  const getPositionColor = (position: number) => {
    switch (position) {
      case 1: return 'bg-warning';
      case 2: return 'bg-neutral-500';
      case 3: return 'bg-amber-600 bg-opacity-70';
      default: return 'bg-secondary';
    }
  };
  
  return (
    <Card className="bg-secondary bg-opacity-70 rounded-xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-center font-game text-2xl">LEADERBOARD</CardTitle>
        <div className="flex justify-between mt-6">
          <Button 
            variant={activeTab === 'balance' ? 'default' : 'outline'} 
            className={activeTab === 'balance' ? 'bg-accent bg-opacity-100' : ''}
            onClick={() => handleTabChange('balance')}
            disabled={loading}
          >
            Top Balance
          </Button>
          <Button 
            variant={activeTab === 'wins' ? 'default' : 'outline'} 
            className={activeTab === 'wins' ? 'bg-accent bg-opacity-100' : ''}
            onClick={() => handleTabChange('wins')}
            disabled={loading}
          >
            Most Wins
          </Button>
          <Button 
            variant={activeTab === 'winrate' ? 'default' : 'outline'} 
            className={activeTab === 'winrate' ? 'bg-accent bg-opacity-100' : ''}
            onClick={() => handleTabChange('winrate')}
            disabled={loading}
          >
            Highest Win Rate
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex justify-center items-center h-80">
            <div className="animate-pulse text-lg">Loading leaderboard...</div>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {entries.map((entry) => (
              <div 
                key={entry.position} 
                className={`flex items-center justify-between p-4 bg-background rounded-lg hover:bg-opacity-70 transition cursor-pointer ${
                  entry.user.id === currentUserId ? 'border border-accent' : ''
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full ${getPositionColor(entry.position)} flex items-center justify-center font-bold mr-3`}>
                    {entry.position}
                  </div>
                  <div className="flex items-center">
                    <Avatar className="mr-3 h-10 w-10">
                      <AvatarFallback className={`${entry.position <= 3 ? 'bg-accent text-white' : ''}`}>
                        {getInitials(entry.user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-medium">{entry.user.username}</span>
                      <div className="text-sm text-muted-foreground">
                        Wins: {entry.stats?.gamesWon || 0} | Losses: {entry.stats?.gamesLost || 0}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="font-mono text-warning text-lg">{formatValue(entry.value)}</div>
              </div>
            ))}
            
            {entries.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No leaderboard data available yet.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
