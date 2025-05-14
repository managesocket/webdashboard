import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './card';
import { Button } from './button';
import { Minus, Plus } from 'lucide-react';

type SlotMachineProps = {
  initialBalance?: number;
};

// Simple mock symbols without external dependencies
const SYMBOLS = [
  { symbol: '7', multiplier: 15, color: 'text-warning' },
  { symbol: '♦', multiplier: 12, color: 'text-error' },
  { symbol: '♣', multiplier: 10, color: 'text-white' },
  { symbol: '♠', multiplier: 8, color: 'text-white' },
  { symbol: '♥', multiplier: 5, color: 'text-error' },
  { symbol: '$', multiplier: 3, color: 'text-success' }
];

export function SlotMachine({ initialBalance = 1000 }: SlotMachineProps) {
  const [bet, setBet] = useState(50);
  const [balance, setBalance] = useState(initialBalance);
  const [spinning, setSpinning] = useState(false);
  const [symbols, setSymbols] = useState(['7', '♦', '♣']);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  const decreaseBet = () => {
    if (bet > 10) setBet(bet - 10);
  };
  
  const increaseBet = () => {
    if (bet + 10 <= balance) setBet(bet + 10);
  };
  
  const handleSpin = async () => {
    if (spinning || balance < bet) return;
    
    setSpinning(true);
    setMessage(null);
    
    // Deduct bet from balance
    setBalance(prev => prev - bet);
    
    // Simulate spinning
    setTimeout(() => {
      // Generate final symbols
      const finalSymbols = [
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].symbol,
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].symbol,
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].symbol
      ];
      
      setSymbols(finalSymbols);
      
      // Check for win (all symbols match)
      if (finalSymbols[0] === finalSymbols[1] && finalSymbols[1] === finalSymbols[2]) {
        const symbolInfo = SYMBOLS.find(s => s.symbol === finalSymbols[0]);
        const multiplier = symbolInfo?.multiplier || 1;
        const winAmount = bet * multiplier;
        
        setLastWin(winAmount);
        setBalance(prev => prev + winAmount);
        setMessage(`You won ${winAmount} coins!`);
      } else {
        setLastWin(0);
        setMessage(`You lost ${bet} coins!`);
      }
      
      setSpinning(false);
    }, 1000);
  };
  
  // Helper function to get symbol color
  const getSymbolColor = (symbol: string) => {
    return SYMBOLS.find(s => s.symbol === symbol)?.color || 'text-white';
  };
  
  return (
    <Card className="bg-background rounded-xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-center">SLOT MACHINE</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <span className="text-muted-foreground">Current Bet:</span>
            <div className="flex items-center">
              <Button 
                variant="outline" 
                size="sm"
                onClick={decreaseBet} 
                disabled={bet <= 10 || spinning}
                className="rounded-r-none h-8 px-2"
              >
                <Minus size={16} />
              </Button>
              <span className="bg-secondary px-4 py-1 font-mono text-warning">{bet}</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={increaseBet} 
                disabled={bet + 10 > balance || spinning}
                className="rounded-l-none h-8 px-2"
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>
          <Button 
            variant="default" 
            className="bg-accent hover:bg-accent/80 px-6 py-2"
            onClick={handleSpin}
            disabled={spinning || balance < bet}
          >
            {spinning ? "SPINNING..." : "SPIN"}
          </Button>
        </div>
        
        {/* Slot Machine Display */}
        <div className="bg-secondary rounded-xl p-4 mb-6">
          <div className="flex justify-center space-x-4">
            {symbols.map((symbol, index) => (
              <div 
                key={index} 
                className="slot-result w-16 h-16 bg-card rounded-lg flex items-center justify-center"
              >
                <span className={`text-2xl ${getSymbolColor(symbol)}`}>{symbol}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Last Spin Result */}
        <div className="text-center mb-8">
          <div className="inline-block bg-secondary rounded-lg px-6 py-3">
            <span className="text-muted-foreground mr-2">Balance:</span>
            <span className="font-medium text-warning">{balance} coins</span>
          </div>
          {message && (
            <div className="mt-3 inline-block ml-4 bg-secondary rounded-lg px-6 py-3">
              <span className={`font-medium ${lastWin && lastWin > 0 ? 'text-success' : 'text-error'}`}>
                {message}
              </span>
            </div>
          )}
        </div>
        
        {/* Paytable */}
        <div className="bg-secondary rounded-xl p-4">
          <h4 className="font-bold text-center mb-4">PAYTABLE</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SYMBOLS.map((symbolInfo, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-8 h-8 bg-card rounded-lg flex items-center justify-center">
                    <span className={`${symbolInfo.color}`}>{symbolInfo.symbol}</span>
                  </div>
                  <div className="w-8 h-8 bg-card rounded-lg flex items-center justify-center">
                    <span className={`${symbolInfo.color}`}>{symbolInfo.symbol}</span>
                  </div>
                  <div className="w-8 h-8 bg-card rounded-lg flex items-center justify-center">
                    <span className={`${symbolInfo.color}`}>{symbolInfo.symbol}</span>
                  </div>
                </div>
                <span className="text-warning font-mono">x{symbolInfo.multiplier}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        Get 3 matching symbols to win!
      </CardFooter>
    </Card>
  );
}