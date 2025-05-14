import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

// Define types
interface MultiplierGame {
  id: number;
  name: string;
  description: string;
  minBet: number;
  maxBet: number;
  houseEdge: number;
  maxMultiplier: number;
  isActive: boolean;
}

interface JackpotPool {
  id: number;
  name: string;
  currentAmount: number;
  seedAmount: number;
  incrementRate: number;
  lastWon?: Date;
  winningUserId?: number;
  winningAmount?: number;
  isActive: boolean;
}

interface GameResult {
  success: boolean;
  result: string;
  multiplier: number;
  winAmount?: number;
  crashPoint?: number;
  jackpotWon?: boolean;
  jackpotAmount?: number;
  freeGamesWon?: number;
  freeGamesMultiplier?: number;
}

interface WebSocketMessage {
  type: string;
  data: any;
  message?: string;
}

const userId = 1; // This would come from auth in a real app

const formatCurrency = (amount: number) => {
  return amount.toLocaleString('en-US');
};

const MultiplierGamePage = () => {
  // State for game settings
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [targetMultiplier, setTargetMultiplier] = useState<number>(2);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1);
  const [isCrashed, setIsCrashed] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [jackpotPools, setJackpotPools] = useState<JackpotPool[]>([]);
  const [cashoutMode, setCashoutMode] = useState<'auto' | 'manual'>('auto');
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  
  // References
  const wsRef = useRef<WebSocket | null>(null);
  const gameTimerId = useRef<number | null>(null);
  const multiplierIncrement = useRef<number>(0.05);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query multiplier games list
  const { data: games = [], isLoading: isLoadingGames } = useQuery<MultiplierGame[]>({ 
    queryKey: ['/api/multiplier-games'],
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  // Query user balance
  const { data: user, isLoading: isLoadingUser } = useQuery<{id: number, balance: number}>({ 
    queryKey: ['/api/users', userId],
    staleTime: 1000 * 60, // 1 minute
  });

  // WebSocket setup
  useEffect(() => {
    // Connect to WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/multiplier`;
    
    const connectWebSocket = () => {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
      };
      
      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          if (message.type === 'jackpot_pools') {
            setJackpotPools(message.data);
          } else if (message.type === 'game_result') {
            handleGameResult(message.data);
          } else if (message.type === 'error') {
            toast({
              title: 'Error',
              description: message.message || 'An error occurred',
              variant: 'destructive',
            });
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
        // Attempt to reconnect after a delay
        setTimeout(connectWebSocket, 3000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.close();
      };
      
      wsRef.current = ws;
    };
    
    connectWebSocket();
    
    // Cleanup
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, []);

  // Initialize with first game when data loads
  useEffect(() => {
    if (games && games.length > 0 && !selectedGameId) {
      setSelectedGameId(games[0].id);
      
      // Set initial bet amount to the min bet of the selected game
      setBetAmount(games[0].minBet);
    }
  }, [games, selectedGameId]);

  // Get selected game
  const selectedGame = games?.find(game => game.id === selectedGameId) || null;

  // Start the game
  const startGame = () => {
    if (!selectedGame || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: 'Connection Error',
        description: 'Cannot connect to the game server. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    // Reset states
    setIsPlaying(true);
    setIsCrashed(false);
    setCurrentMultiplier(1);
    setGameResult(null);
    
    // Trigger WebSocket gameplay if in manual mode
    if (cashoutMode === 'manual') {
      // Send play game message via WebSocket
      wsRef.current.send(JSON.stringify({
        type: 'play_game',
        userId,
        gameId: selectedGameId,
        betAmount,
        targetMultiplier: 1000 // Very high value as we'll cash out manually
      }));
      
      // Start the multiplier animation
      const startTime = Date.now();
      const maxMultiplierGrowth = 10; // seconds to reach 2x
      
      gameTimerId.current = window.setInterval(() => {
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        // Exponential growth formula to make it more realistic
        const newMultiplier = Math.pow(2, elapsedSeconds / maxMultiplierGrowth);
        setCurrentMultiplier(parseFloat(newMultiplier.toFixed(2)));
      }, 50);
    } else {
      // Auto mode - send the request with target multiplier
      wsRef.current.send(JSON.stringify({
        type: 'play_game',
        userId,
        gameId: selectedGameId,
        betAmount,
        targetMultiplier
      }));
      
      // Simulate the multiplier animation until target or crash
      const startTime = Date.now();
      const targetTime = Math.log2(targetMultiplier) * 3000; // time to reach target in ms
      
      gameTimerId.current = window.setInterval(() => {
        const elapsedMs = Date.now() - startTime;
        const progress = Math.min(elapsedMs / targetTime, 1);
        const newMultiplier = 1 + progress * (targetMultiplier - 1);
        setCurrentMultiplier(parseFloat(newMultiplier.toFixed(2)));
        
        // Stop at target multiplier
        if (progress >= 1) {
          clearInterval(gameTimerId.current!);
        }
      }, 50);
    }
  };

  // Manual cashout
  const handleCashout = () => {
    if (!isPlaying || cashoutMode !== 'manual' || !wsRef.current) return;
    
    clearInterval(gameTimerId.current!);
    
    // Send cashout message
    wsRef.current.send(JSON.stringify({
      type: 'cashout',
      userId,
      gameId: selectedGameId,
      multiplier: currentMultiplier
    }));
  };

  // Handle game result
  const handleGameResult = (result: GameResult) => {
    // Clear any running timer
    if (gameTimerId.current) {
      clearInterval(gameTimerId.current);
      gameTimerId.current = null;
    }
    
    // Update UI
    setGameResult(result);
    setIsPlaying(false);
    
    if (!result.success) {
      toast({
        title: 'Game Error',
        description: result.result,
        variant: 'destructive',
      });
      return;
    }
    
    // If game crashed
    if (result.crashPoint && result.crashPoint < targetMultiplier) {
      setIsCrashed(true);
      
      // Complete the animation to show crash point
      const simulateCrash = () => {
        let currentValue = currentMultiplier;
        const increment = (result.crashPoint! - currentValue) / 20;
        
        const crashTimer = setInterval(() => {
          currentValue += increment;
          if (currentValue >= result.crashPoint!) {
            clearInterval(crashTimer);
            setCurrentMultiplier(result.crashPoint!);
          } else {
            setCurrentMultiplier(parseFloat(currentValue.toFixed(2)));
          }
        }, 50);
      };
      
      simulateCrash();
    }
    
    // Show appropriate toast for the result
    if (result.jackpotWon) {
      toast({
        title: '🎊 JACKPOT WIN! 🎊',
        description: `You won the jackpot of ${formatCurrency(result.jackpotAmount!)} coins!`,
        variant: 'default',
        duration: 10000,
      });
    } else if (result.freeGamesWon && result.freeGamesWon > 0) {
      toast({
        title: '🎁 Free Games Won!',
        description: `You won ${result.freeGamesWon} free games with a ${result.freeGamesMultiplier}x multiplier!`,
        variant: 'default',
        duration: 5000,
      });
    } else if (result.winAmount && result.winAmount > 0) {
      toast({
        title: 'Win!',
        description: `You won ${formatCurrency(result.winAmount)} coins!`,
        variant: 'default',
      });
    } else {
      toast({
        title: 'Game Over',
        description: result.result,
        variant: 'destructive',
      });
    }
    
    // Refresh user data to update balance
    queryClient.invalidateQueries({ queryKey: ['/api/users', userId] });
  };

  // Calculate multiplier label and progress
  const multiplierProgress = Math.min(((currentMultiplier - 1) / (targetMultiplier - 1)) * 100, 100);
  const formattedMultiplier = currentMultiplier.toFixed(2) + 'x';

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Multiplier Games</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Game Selection and Betting Panel */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="play" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="play">Play Game</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="play" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Game Setup</CardTitle>
                  <CardDescription>Choose your game and bet settings</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Game Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="game-select">Select Game</Label>
                    <Select 
                      value={selectedGameId?.toString() || ''} 
                      onValueChange={(value) => setSelectedGameId(parseInt(value))}
                      disabled={isPlaying || isLoadingGames}
                    >
                      <SelectTrigger id="game-select">
                        <SelectValue placeholder="Select a game" />
                      </SelectTrigger>
                      <SelectContent>
                        {games?.map((game) => (
                          <SelectItem key={game.id} value={game.id.toString()}>
                            {game.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedGame && (
                      <p className="text-sm text-muted-foreground">{selectedGame.description}</p>
                    )}
                  </div>
                  
                  {/* Bet Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="bet-amount">Bet Amount</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="bet-amount"
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        min={selectedGame?.minBet || 1}
                        max={selectedGame?.maxBet || 10000}
                        disabled={isPlaying}
                        className="w-32"
                      />
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setBetAmount(prev => Math.max((selectedGame?.minBet || 1), prev / 2))}
                          disabled={isPlaying}
                        >
                          ½
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setBetAmount(prev => Math.min((selectedGame?.maxBet || 10000), prev * 2))}
                          disabled={isPlaying}
                        >
                          2×
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setBetAmount(selectedGame?.minBet || 10)}
                          disabled={isPlaying}
                        >
                          Min
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setBetAmount(selectedGame?.maxBet || 10000)}
                          disabled={isPlaying}
                        >
                          Max
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Cashout Mode */}
                  <div className="space-y-2">
                    <Label>Cashout Mode</Label>
                    <div className="flex space-x-2">
                      <Button 
                        variant={cashoutMode === 'auto' ? 'default' : 'outline'}
                        onClick={() => setCashoutMode('auto')}
                        disabled={isPlaying}
                      >
                        Auto Cashout
                      </Button>
                      <Button 
                        variant={cashoutMode === 'manual' ? 'default' : 'outline'}
                        onClick={() => setCashoutMode('manual')}
                        disabled={isPlaying}
                      >
                        Manual Cashout
                      </Button>
                    </div>
                  </div>
                  
                  {/* Target Multiplier (Auto mode only) */}
                  {cashoutMode === 'auto' && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="target-multiplier">Target Multiplier: {targetMultiplier.toFixed(2)}x</Label>
                        <div className="text-sm text-muted-foreground">
                          Potential Win: {formatCurrency(betAmount * targetMultiplier)}
                        </div>
                      </div>
                      <Slider
                        id="target-multiplier"
                        defaultValue={[2]}
                        value={[targetMultiplier]}
                        min={1.1}
                        max={selectedGame?.maxMultiplier || 100}
                        step={0.1}
                        onValueChange={(values) => setTargetMultiplier(values[0])}
                        disabled={isPlaying}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1.1x</span>
                        <span>{selectedGame?.maxMultiplier || 100}x</span>
                      </div>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="flex justify-between">
                  <div className="text-sm">
                    Balance: {formatCurrency(user?.balance || 0)} coins
                  </div>
                  
                  {isPlaying && cashoutMode === 'manual' ? (
                    <Button 
                      variant="destructive" 
                      onClick={handleCashout}
                      disabled={!wsConnected}
                    >
                      Cash Out @ {formattedMultiplier}
                    </Button>
                  ) : (
                    <Button 
                      onClick={startGame}
                      disabled={
                        isPlaying || 
                        !selectedGameId || 
                        betAmount <= 0 || 
                        (selectedGame && (betAmount < selectedGame.minBet || betAmount > selectedGame.maxBet)) ||
                        !wsConnected ||
                        (user && betAmount > user.balance)
                      }
                    >
                      {isPlaying ? 'Playing...' : 'Start Game'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
              
              {/* Game Display */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between">
                    <span>Multiplier: {formattedMultiplier}</span>
                    {gameResult && <span className={gameResult.winAmount ? 'text-green-500' : 'text-red-500'}>
                      {gameResult.winAmount ? `+${formatCurrency(gameResult.winAmount)}` : 'Crashed'}
                    </span>}
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="relative pt-1">
                    <Progress 
                      value={multiplierProgress} 
                      className={`h-8 ${isCrashed ? 'bg-red-200' : ''}`} 
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-foreground font-bold">
                      {formattedMultiplier}
                    </div>
                  </div>
                  
                  {gameResult && (
                    <div className="mt-4 p-4 border rounded-md bg-muted">
                      <p className="font-medium">{gameResult.result}</p>
                      
                      {gameResult.jackpotWon && (
                        <p className="text-amber-500 font-bold mt-2">
                          🎊 JACKPOT WIN: {formatCurrency(gameResult.jackpotAmount!)} coins 🎊
                        </p>
                      )}
                      
                      {gameResult.freeGamesWon && gameResult.freeGamesWon > 0 && (
                        <p className="text-blue-500 font-medium mt-2">
                          🎁 You won {gameResult.freeGamesWon} free games with a {gameResult.freeGamesMultiplier}x multiplier!
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Game History</CardTitle>
                  <CardDescription>Your recent multiplier games</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Transaction history will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Jackpot and Stats Panel */}
        <div className="space-y-6">
          {/* Jackpot Pools */}
          <Card>
            <CardHeader>
              <CardTitle>Jackpot Pools</CardTitle>
              <CardDescription>Current jackpot amounts</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {jackpotPools.length === 0 ? (
                <p>Loading jackpot pools...</p>
              ) : (
                jackpotPools.map((pool) => (
                  <div key={pool.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{pool.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Contribution: {(pool.incrementRate * 100).toFixed(2)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-500">{formatCurrency(pool.currentAmount)}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          
          {/* Game Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Game Stats</CardTitle>
              <CardDescription>Your gaming statistics</CardDescription>
            </CardHeader>
            
            <CardContent>
              <p>Game statistics will be displayed here.</p>
            </CardContent>
          </Card>
          
          {/* Free Games */}
          <Card>
            <CardHeader>
              <CardTitle>Free Games</CardTitle>
              <CardDescription>Your available free games</CardDescription>
            </CardHeader>
            
            <CardContent>
              <p>Free games will be displayed here.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MultiplierGamePage;