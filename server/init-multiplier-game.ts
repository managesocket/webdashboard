import { db } from './db';
import { jackpotPools, multiplierGames } from '@shared/schema';

async function main() {
  try {
    console.log('Creating initial multiplier games and jackpot pools...');
    
    // Create default multiplier game
    const existingGames = await db.select().from(multiplierGames);
    
    if (existingGames.length === 0) {
      await db.insert(multiplierGames).values([
        {
          name: 'Classic Crash',
          description: 'Watch the multiplier rise - cash out before it crashes!',
          minBet: 10,
          maxBet: 10000,
          houseEdge: 0.05,   // 5% house edge
          maxMultiplier: 100,
          crashChanceDivisor: 33.33,
          isActive: true
        },
        {
          name: 'High Risk',
          description: 'Higher risk, higher rewards! Better odds for jackpots.',
          minBet: 100,
          maxBet: 50000,
          houseEdge: 0.07,   // 7% house edge
          maxMultiplier: 500,
          crashChanceDivisor: 25.0,
          isActive: true
        },
        {
          name: 'Beginner Mode',
          description: 'Safe and easy mode for beginners with lower house edge.',
          minBet: 1,
          maxBet: 1000,
          houseEdge: 0.03,   // 3% house edge
          maxMultiplier: 20,
          crashChanceDivisor: 50.0,
          isActive: true
        }
      ]);
      
      console.log('Created 3 default multiplier games');
    } else {
      console.log(`Skipping multiplier game creation, found ${existingGames.length} existing games`);
    }
    
    // Create default jackpot pools
    const existingPools = await db.select().from(jackpotPools);
    
    if (existingPools.length === 0) {
      await db.insert(jackpotPools).values([
        {
          name: 'Mini Jackpot',
          currentAmount: 5000,
          seedAmount: 5000,
          incrementRate: 0.0025,  // 0.25% of each bet goes to jackpot
          isActive: true
        },
        {
          name: 'Major Jackpot',
          currentAmount: 25000,
          seedAmount: 25000,
          incrementRate: 0.005,   // 0.5% of each bet goes to jackpot
          isActive: true
        },
        {
          name: 'Grand Jackpot',
          currentAmount: 100000,
          seedAmount: 100000,
          incrementRate: 0.01,    // 1% of each bet goes to jackpot
          isActive: true
        }
      ]);
      
      console.log('Created 3 default jackpot pools');
    } else {
      console.log(`Skipping jackpot pool creation, found ${existingPools.length} existing pools`);
    }
    
    console.log('Initialization completed successfully');
  } catch (error) {
    console.error('Initialization failed:', error);
    process.exit(1);
  }
}

// Execute the initialization
main().catch(console.error).finally(() => process.exit(0));