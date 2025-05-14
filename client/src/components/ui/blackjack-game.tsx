import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './card';
import { Button } from './button';
import { X } from 'lucide-react';

type BlackjackGameProps = {
  initialBalance?: number;
  initialBet?: number;
  onClose?: () => void;
  onPlay?: (action: 'hit' | 'stand' | 'double', bet: number) => Promise<{
    playerHand: string[];
    dealerHand: string[];
    result: string;
    winAmount?: number;
  }>;
};

export function BlackjackGame({ initialBalance = 1000, initialBet = 50, onClose, onPlay }: BlackjackGameProps) {
  const [balance, setBalance] = useState(initialBalance);
  const [bet, setBet] = useState(initialBet);
  const [gameState, setGameState] = useState<'initial' | 'playing' | 'result'>('initial');
  const [playerHand, setPlayerHand] = useState<string[]>([]);
  const [dealerHand, setDealerHand] = useState<string[]>([]);
  const [playerValue, setPlayerValue] = useState(0);
  const [dealerValue, setDealerValue] = useState(0);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize a new game
  const startNewGame = async () => {
    if (balance < bet) {
      setMessage("Not enough balance to play!");
      return;
    }
    
    setIsLoading(true);
    setGameState('playing');
    
    if (onPlay) {
      try {
        const result = await onPlay('hit', bet);
        setPlayerHand(result.playerHand);
        setDealerHand(result.dealerHand);
        
        // Calculate values
        setPlayerValue(calculateHandValue(result.playerHand));
        setDealerValue(calculateHandValue([result.dealerHand[0]])); // Only show dealer's first card
        
        // Check for natural blackjack
        if (calculateHandValue(result.playerHand) === 21) {
          handleGameResult(result);
        }
      } catch (error) {
        console.error(error);
        setMessage("Failed to start game. Please try again.");
        setGameState('initial');
      }
    } else {
      // Demo mode - generate random hands
      const deck = createDeck();
      shuffleDeck(deck);
      
      const pHand = [drawCard(deck), drawCard(deck)];
      const dHand = [drawCard(deck), drawCard(deck)];
      
      setPlayerHand(pHand);
      setDealerHand(dHand);
      
      setPlayerValue(calculateHandValue(pHand));
      setDealerValue(calculateHandValue([dHand[0]])); // Only show dealer's first card
      
      // Deduct bet
      setBalance(prevBalance => prevBalance - bet);
      
      // Check for natural blackjack
      if (calculateHandValue(pHand) === 21) {
        // Reveal dealer's second card
        setDealerValue(calculateHandValue(dHand));
        
        if (calculateHandValue(dHand) === 21) {
          // Push - return bet
          setBalance(prevBalance => prevBalance + bet);
          setMessage("Push! Both have blackjack. Bet returned.");
        } else {
          // Player wins with blackjack (pays 3:2)
          const winAmount = Math.floor(bet * 2.5);
          setBalance(prevBalance => prevBalance + winAmount);
          setMessage(`Blackjack! You win ${winAmount} coins!`);
        }
        setGameState('result');
      }
    }
    
    setIsLoading(false);
  };
  
  // Handle player actions
  const handleAction = async (action: 'hit' | 'stand' | 'double') => {
    if (gameState !== 'playing' || isLoading) return;
    
    setIsLoading(true);
    
    if (onPlay) {
      try {
        const result = await onPlay(action, bet);
        
        if (action === 'double') {
          // Double the bet
          setBalance(prevBalance => prevBalance - bet);
          setBet(prevBet => prevBet * 2);
        }
        
        setPlayerHand(result.playerHand);
        setDealerHand(result.dealerHand);
        
        // Calculate values
        setPlayerValue(calculateHandValue(result.playerHand));
        setDealerValue(calculateHandValue(result.dealerHand));
        
        handleGameResult(result);
      } catch (error) {
        console.error(error);
        setMessage("Failed to process action. Please try again.");
      }
    } else {
      // Demo mode
      const deck = createDeck();
      shuffleDeck(deck);
      
      if (action === 'hit') {
        // Add a card to player's hand
        const newCard = drawCard(deck);
        const newPlayerHand = [...playerHand, newCard];
        setPlayerHand(newPlayerHand);
        
        const newValue = calculateHandValue(newPlayerHand);
        setPlayerValue(newValue);
        
        if (newValue > 21) {
          // Player busts
          setMessage(`Bust! Your hand value: ${newValue}. You lost ${bet} coins.`);
          setDealerValue(calculateHandValue(dealerHand));
          setGameState('result');
        }
      } else if (action === 'stand') {
        // Dealer's turn
        let currentDealerHand = [...dealerHand];
        let currentDealerValue = calculateHandValue(currentDealerHand);
        
        // Dealer must hit until 17 or higher
        while (currentDealerValue < 17) {
          const newCard = drawCard(deck);
          currentDealerHand.push(newCard);
          currentDealerValue = calculateHandValue(currentDealerHand);
        }
        
        setDealerHand(currentDealerHand);
        setDealerValue(currentDealerValue);
        
        // Determine winner
        const finalPlayerValue = playerValue;
        
        if (currentDealerValue > 21) {
          // Dealer busts, player wins
          const winAmount = bet * 2;
          setBalance(prevBalance => prevBalance + winAmount);
          setMessage(`Dealer busts! You win ${winAmount} coins!`);
        } else if (finalPlayerValue > currentDealerValue) {
          // Player wins
          const winAmount = bet * 2;
          setBalance(prevBalance => prevBalance + winAmount);
          setMessage(`You win! Your hand: ${finalPlayerValue}, Dealer: ${currentDealerValue}. You won ${winAmount} coins.`);
        } else if (finalPlayerValue === currentDealerValue) {
          // Push - return bet
          setBalance(prevBalance => prevBalance + bet);
          setMessage(`Push! Your hand: ${finalPlayerValue}, Dealer: ${currentDealerValue}. Your bet has been returned.`);
        } else {
          // Dealer wins
          setMessage(`Dealer wins! Your hand: ${finalPlayerValue}, Dealer: ${currentDealerValue}. You lost ${bet} coins.`);
        }
        
        setGameState('result');
      } else if (action === 'double') {
        // Double down - double bet, take one card, then stand
        if (balance < bet) {
          setMessage("Not enough balance to double down!");
          setIsLoading(false);
          return;
        }
        
        // Double the bet
        setBalance(prevBalance => prevBalance - bet);
        setBet(prevBet => prevBet * 2);
        
        // Add one card to player's hand
        const newCard = drawCard(deck);
        const newPlayerHand = [...playerHand, newCard];
        setPlayerHand(newPlayerHand);
        
        const newValue = calculateHandValue(newPlayerHand);
        setPlayerValue(newValue);
        
        if (newValue > 21) {
          // Player busts
          setMessage(`Bust! Your hand value: ${newValue}. You lost ${bet * 2} coins.`);
          setDealerValue(calculateHandValue(dealerHand));
          setGameState('result');
        } else {
          // Dealer's turn
          let currentDealerHand = [...dealerHand];
          let currentDealerValue = calculateHandValue(currentDealerHand);
          
          // Dealer must hit until 17 or higher
          while (currentDealerValue < 17) {
            const newCard = drawCard(deck);
            currentDealerHand.push(newCard);
            currentDealerValue = calculateHandValue(currentDealerHand);
          }
          
          setDealerHand(currentDealerHand);
          setDealerValue(currentDealerValue);
          
          // Determine winner
          if (currentDealerValue > 21) {
            // Dealer busts, player wins
            const winAmount = bet * 4; // Double bet * 2
            setBalance(prevBalance => prevBalance + winAmount);
            setMessage(`Dealer busts! You win ${winAmount} coins!`);
          } else if (newValue > currentDealerValue) {
            // Player wins
            const winAmount = bet * 4; // Double bet * 2
            setBalance(prevBalance => prevBalance + winAmount);
            setMessage(`You win! Your hand: ${newValue}, Dealer: ${currentDealerValue}. You won ${winAmount} coins.`);
          } else if (newValue === currentDealerValue) {
            // Push - return bet
            setBalance(prevBalance => prevBalance + bet * 2); // Return doubled bet
            setMessage(`Push! Your hand: ${newValue}, Dealer: ${currentDealerValue}. Your bet has been returned.`);
          } else {
            // Dealer wins
            setMessage(`Dealer wins! Your hand: ${newValue}, Dealer: ${currentDealerValue}. You lost ${bet * 2} coins.`);
          }
          
          setGameState('result');
        }
      }
    }
    
    setIsLoading(false);
  };
  
  const handleGameResult = (result: { playerHand: string[], dealerHand: string[], result: string, winAmount?: number }) => {
    setPlayerValue(calculateHandValue(result.playerHand));
    setDealerValue(calculateHandValue(result.dealerHand));
    setMessage(result.result);
    
    if (result.winAmount && result.winAmount > 0) {
      setBalance(prevBalance => prevBalance + result.winAmount);
    }
    
    setGameState('result');
  };
  
  // Reset game state for a new round
  const playAgain = () => {
    setPlayerHand([]);
    setDealerHand([]);
    setPlayerValue(0);
    setDealerValue(0);
    setMessage('');
    setGameState('initial');
  };
  
  // Helper functions for cards
  const createDeck = (): string[] => {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck: string[] = [];
    
    for (const suit of suits) {
      for (const value of values) {
        deck.push(`${value}${suit}`);
      }
    }
    
    return deck;
  };
  
  const shuffleDeck = (deck: string[]): void => {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]]; // Swap
    }
  };
  
  const drawCard = (deck: string[]): string => {
    return deck.splice(Math.floor(Math.random() * deck.length), 1)[0];
  };
  
  const calculateHandValue = (hand: string[]): number => {
    let value = 0;
    let aces = 0;
    
    for (const card of hand) {
      const cardValue = card.slice(0, -1); // Remove suit
      
      if (cardValue === 'A') {
        aces++;
        value += 11;
      } else if (['J', 'Q', 'K'].includes(cardValue)) {
        value += 10;
      } else {
        value += parseInt(cardValue);
      }
    }
    
    // Adjust for aces if needed
    while (value > 21 && aces > 0) {
      value -= 10; // Convert an ace from 11 to 1
      aces--;
    }
    
    return value;
  };
  
  const renderCard = (card: string) => {
    const cardValue = card.slice(0, -1);
    const suit = card.slice(-1);
    const color = suit === '♥' || suit === '♦' ? 'text-red-500' : 'text-white';
    
    return (
      <div className="bg-secondary rounded-lg w-16 h-24 flex items-center justify-center">
        <span className={`font-game text-lg ${color}`}>{cardValue}{suit}</span>
      </div>
    );
  };
  
  const renderHiddenCard = () => (
    <div className="bg-secondary rounded-lg w-16 h-24 flex items-center justify-center">
      <div className="w-12 h-20 bg-accent rounded-lg flex items-center justify-center">
        <span className="font-bold text-white">?</span>
      </div>
    </div>
  );
  
  return (
    <Card className="bg-background rounded-xl shadow-lg max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Blackjack</CardTitle>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-6">
        <div className="bg-secondary bg-opacity-60 rounded-xl p-4 mb-6">
          <div className="mb-6">
            <h4 className="text-muted-foreground text-sm mb-2">Dealer's Hand</h4>
            <div className="flex space-x-2 flex-wrap">
              {dealerHand.length > 0 ? (
                <>
                  {renderCard(dealerHand[0])}
                  {gameState === 'playing' && dealerHand.length > 1 ? renderHiddenCard() : null}
                  {(gameState === 'result' || gameState === 'initial') && dealerHand.slice(1).map((card, index) => (
                    <div key={index}>{renderCard(card)}</div>
                  ))}
                  <div className="text-muted-foreground mt-8 ml-2">
                    <span>Value: {dealerValue}</span>
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">Waiting for game to start...</div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-muted-foreground text-sm mb-2">Your Hand</h4>
            <div className="flex space-x-2 flex-wrap">
              {playerHand.length > 0 ? (
                <>
                  {playerHand.map((card, index) => (
                    <div key={index}>{renderCard(card)}</div>
                  ))}
                  <div className="text-muted-foreground mt-8 ml-2">
                    <span>Value: {playerValue}</span>
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">Waiting for game to start...</div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <span className="text-muted-foreground">Current Bet:</span>
            <span className="font-mono text-warning ml-2">{bet}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Balance:</span>
            <span className="font-mono text-warning ml-2">{balance}</span>
          </div>
        </div>
        
        {message && (
          <div className="bg-secondary p-3 rounded-lg mb-6 text-center">
            <p className={playerValue > 21 || (gameState === 'result' && playerValue < dealerValue && dealerValue <= 21) ? 'text-error' : 'text-success'}>
              {message}
            </p>
          </div>
        )}
        
        {gameState === 'initial' && (
          <Button 
            className="w-full bg-accent hover:bg-accent/80" 
            onClick={startNewGame}
            disabled={isLoading || balance < bet}
          >
            Deal Cards
          </Button>
        )}
        
        {gameState === 'playing' && (
          <div className="flex space-x-3">
            <Button 
              className="flex-1 bg-success hover:bg-success/80" 
              onClick={() => handleAction('hit')}
              disabled={isLoading}
            >
              Hit
            </Button>
            <Button 
              className="flex-1 bg-error hover:bg-error/80" 
              onClick={() => handleAction('stand')}
              disabled={isLoading}
            >
              Stand
            </Button>
            <Button 
              className="flex-1 bg-info hover:bg-info/80" 
              onClick={() => handleAction('double')}
              disabled={isLoading || balance < bet || playerHand.length > 2}
            >
              Double
            </Button>
          </div>
        )}
        
        {gameState === 'result' && (
          <Button 
            className="w-full bg-accent hover:bg-accent/80" 
            onClick={playAgain}
            disabled={isLoading || balance < bet}
          >
            Play Again
          </Button>
        )}
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        Get as close to 21 as possible without going over.
      </CardFooter>
    </Card>
  );
}
