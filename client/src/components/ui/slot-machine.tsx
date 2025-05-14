import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './card';
import { Button } from './button';
import { SlotSymbols } from '@/lib/icons';
import { SLOT_SYMBOLS } from '@shared/schema';
import { Minus, Plus } from 'lucide-react';

type SlotMachineProps = {
  initialBalance?: number;
  onSpin?: (bet: number) => Promise<{ symbols: string[], winAmount: number }>;
};

export function SlotMachine({ initialBalance = 1000, onSpin }: SlotMachineProps) {
  const [bet, setBet] = useState(50);
  const [balance, setBalance] = useState(initialBalance);
  const [spinning, setSpinning] = useState(false);
  const [symbols, setSymbols] = useState(['sdiamond', 'scherry', 'slemon']);
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
    
    // Animate the slots
    const spinDuration = 1500;
    const spinInterval = 100;
    const spins = Math.floor(spinDuration / spinInterval);
    let currentSpin = 0;
    
    const spinAnimation = setInterval(() => {
      currentSpin++;
      
      // Random symbols during animation
      setSymbols([
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].symbol,
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].symbol,
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].symbol
      ]);
      
      if (currentSpin >= spins) {
        clearInterval(spinAnimation);
        
        // If onSpin callback is provided, use it for the final result
        if (onSpin) {
          onSpin(bet).then(result => {
            setSymbols(result.symbols);
            setLastWin(result.winAmount);
            
            // Update balance
            if (result.winAmount > 0) {
              setBalance(prev => prev + result.winAmount);
              setMessage(`You won ${result.winAmount} coins!`);
            } else {
              setMessage(`You lost ${bet} coins!`);
            }
            
            setSpinning(false);
          });
        } else {
          // Demo mode - random result
          const finalSymbols = [
            SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].symbol,
            SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].symbol,
            SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].symbol
          ];
          
          setSymbols(finalSymbols);
          
          // Check for win (all symbols match)
          if (finalSymbols[0] === finalSymbols[1] && finalSymbols[1] === finalSymbols[2]) {
            const symbolInfo = SLOT_SYMBOLS.find(s => s.symbol === finalSymbols[0]);
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
        }
      }
    }, spinInterval);
  };
  
  // Helper function to render symbol
  const renderSymbol = (symbolName: string) => {
    switch (symbolName) {
      case 'sdiamond': return <SlotSymbols.Diamond className="w-full h-full" />;
      case 'scherry': return <SlotSymbols.Cherry className="w-full h-full" />;
      case 'slemon': return <SlotSymbols.Lemon className="w-full h-full" />;
      case 'sbar': return <SlotSymbols.Bar className="w-full h-full" />;
      case 'sseven': return <SlotSymbols.Seven className="w-full h-full" />;
      case 'smelon': return <SlotSymbols.Melon className="w-full h-full" />;
      case 'sheart': return <SlotSymbols.Heart className="w-full h-full" />;
      default: return <SlotSymbols.Diamond className="w-full h-full" />;
    }
  };
  
  return (
    <Card className="bg-background rounded-xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-center font-game">SLOT MACHINE</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <span className="text-muted-foreground">Current Bet:</span>
            <div className="flex items-center">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={decreaseBet} 
                disabled={bet <= 10 || spinning}
                className="rounded-r-none"
              >
                <Minus size={16} />
              </Button>
              <span className="bg-secondary px-4 py-1 font-mono text-warning">{bet}</span>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={increaseBet} 
                disabled={bet + 10 > balance || spinning}
                className="rounded-l-none"
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>
          <Button 
            variant="default" 
            className="bg-accent hover:bg-accent/80 px-6 py-2 text-lg"
            onClick={handleSpin}
            disabled={spinning || balance < bet}
          >
            SPIN
          </Button>
        </div>
        
        {/* Slot Machine Display */}
        <div className="bg-secondary rounded-xl p-4 mb-6">
          <div className="flex justify-center space-x-2 md:space-x-6">
            {symbols.map((symbol, index) => (
              <div key={index} className="slot-result">
                {renderSymbol(symbol)}
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
            {SLOT_SYMBOLS.map((symbol, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-8 h-8">
                    {renderSymbol(symbol.symbol)}
                  </div>
                  <div className="w-8 h-8">
                    {renderSymbol(symbol.symbol)}
                  </div>
                  <div className="w-8 h-8">
                    {renderSymbol(symbol.symbol)}
                  </div>
                </div>
                <span className="text-warning font-mono">x{symbol.multiplier}</span>
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
