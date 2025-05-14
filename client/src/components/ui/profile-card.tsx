import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Progress } from './progress';
import { User, GameStat } from '@shared/schema';

type ProfileCardProps = {
  user?: Partial<User>;
  stats?: Partial<GameStat>;
  favoriteGames?: {
    name: string;
    count: number;
  }[];
  biggestWins?: {
    game: string;
    amount: number;
    details?: string;
  }[];
};

export function ProfileCard({ user, stats, favoriteGames, biggestWins }: ProfileCardProps) {
  const winRate = stats?.gamesPlayed && stats.gamesPlayed > 0
    ? Math.round((stats.gamesWon || 0) / stats.gamesPlayed * 100)
    : 0;
  
  // Get initials from username
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };
  
  // Format join date
  const formatJoinDate = (date?: Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="col-span-1">
        <Card className="bg-card bg-opacity-70 profile-stats h-full">
          <CardHeader>
            <CardTitle className="text-center">Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-24 h-24 rounded-full bg-accent mx-auto flex items-center justify-center text-3xl font-bold">
                <span>{getInitials(user?.username)}</span>
              </div>
              <h4 className="mt-3 font-bold text-lg">{user?.username || 'Guest User'}</h4>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member Since:</span>
              <span>{formatJoinDate(user?.joinDate as Date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Balance:</span>
              <span className="font-mono text-warning">{user?.balance?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Games Played:</span>
              <span>{stats?.gamesPlayed || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Wins:</span>
              <span className="text-success">{stats?.gamesWon || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Losses:</span>
              <span className="text-error">{stats?.gamesLost || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="col-span-1 md:col-span-2">
        <Card className="bg-card bg-opacity-70 profile-stats h-full">
          <CardHeader>
            <CardTitle>Your Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Win Rate</h4>
              <Progress value={winRate} className="h-4" />
              <div className="flex justify-between text-sm mt-1">
                <span>{winRate}%</span>
                <span className="text-muted-foreground">Goal: 50%</span>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Favorite Games</h4>
              <div className="space-y-2">
                {favoriteGames && favoriteGames.length > 0 ? (
                  favoriteGames.map((game, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span>{game.name}</span>
                      <span className="text-muted-foreground">{game.count} games</span>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground">No games played yet</div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Biggest Wins</h4>
              <div className="space-y-2">
                {biggestWins && biggestWins.length > 0 ? (
                  biggestWins.map((win, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span>{win.game}</span>
                      <span className="text-success font-mono">+{win.amount}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground">No wins recorded yet</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
