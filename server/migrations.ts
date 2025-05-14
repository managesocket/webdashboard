import { db } from './db';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    console.log('Starting database migrations...');
    
    // Push schema changes to database
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
    
    console.log('Creating enums...');
    
    // Create enums
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'game_type') THEN
          CREATE TYPE game_type AS ENUM (
            'blackjack', 'coinflip', 'crash', 'slots', 'roulette', 'dice',
            'race', 'roll', 'sevens', 'connectfour', 'tictactoe', 'higherorlower',
            'poker', 'rockpaperscissors', 'findthelady', 'multiplier', 'freespin'
          );
        ELSE
          -- Add new game types if the enum already exists
          BEGIN
            ALTER TYPE game_type ADD VALUE IF NOT EXISTS 'multiplier';
            ALTER TYPE game_type ADD VALUE IF NOT EXISTS 'freespin';
          EXCEPTION
            WHEN duplicate_object THEN null;
          END;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'outcome') THEN
          CREATE TYPE outcome AS ENUM (
            'win', 'loss', 'tie', 'crash', 'abort', 'pending', 
            'jackpot', 'bonus', 'freegames', 'multiplier'
          );
        ELSE
          -- Add new outcomes if the enum already exists
          BEGIN
            ALTER TYPE outcome ADD VALUE IF NOT EXISTS 'jackpot';
            ALTER TYPE outcome ADD VALUE IF NOT EXISTS 'bonus';
            ALTER TYPE outcome ADD VALUE IF NOT EXISTS 'freegames';
            ALTER TYPE outcome ADD VALUE IF NOT EXISTS 'multiplier';
          EXCEPTION
            WHEN duplicate_object THEN null;
          END;
        END IF;
      END $$;
    `);
    
    console.log('Creating tables...');
    
    // Create tables
    
    // Users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        discord_id TEXT UNIQUE,
        avatar_url TEXT,
        balance INTEGER NOT NULL DEFAULT 1000,
        level INTEGER NOT NULL DEFAULT 0,
        xp INTEGER NOT NULL DEFAULT 0,
        daily_last_claimed TIMESTAMP,
        work_last_claimed TIMESTAMP,
        weekly_last_claimed TIMESTAMP,
        monthly_last_claimed TIMESTAMP,
        yearly_last_claimed TIMESTAMP,
        overtime_last_claimed TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Game stats table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS game_stats (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        games_played INTEGER NOT NULL DEFAULT 0,
        games_won INTEGER NOT NULL DEFAULT 0,
        games_lost INTEGER NOT NULL DEFAULT 0,
        total_wagered INTEGER NOT NULL DEFAULT 0,
        total_won INTEGER NOT NULL DEFAULT 0,
        total_lost INTEGER NOT NULL DEFAULT 0,
        highest_win INTEGER NOT NULL DEFAULT 0,
        highest_loss INTEGER NOT NULL DEFAULT 0,
        favorite_game TEXT,
        last_played TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Game transactions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS game_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        game_type game_type NOT NULL,
        bet_amount INTEGER NOT NULL,
        outcome outcome NOT NULL,
        win_amount INTEGER NOT NULL DEFAULT 0,
        game_details JSONB,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create mining system tables
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS mining_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
        mine_name TEXT NOT NULL,
        level INTEGER NOT NULL DEFAULT 1,
        prestige_level INTEGER NOT NULL DEFAULT 0,
        last_dig TIMESTAMP,
        last_process TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS mining_inventory (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
        coal INTEGER NOT NULL DEFAULT 0,
        ore INTEGER NOT NULL DEFAULT 0,
        unprocessed_materials INTEGER NOT NULL DEFAULT 0,
        diamonds INTEGER NOT NULL DEFAULT 0,
        emeralds INTEGER NOT NULL DEFAULT 0,
        lapis INTEGER NOT NULL DEFAULT 0,
        redstone INTEGER NOT NULL DEFAULT 0,
        tech_packs INTEGER NOT NULL DEFAULT 0,
        utility_packs INTEGER NOT NULL DEFAULT 0,
        production_packs INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS mining_units (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        unit_type TEXT NOT NULL,
        level INTEGER NOT NULL DEFAULT 1,
        quantity INTEGER NOT NULL DEFAULT 1,
        efficiency INTEGER NOT NULL DEFAULT 100,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create items and inventory system
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        price INTEGER NOT NULL,
        sell_price INTEGER NOT NULL,
        properties JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        item_id INTEGER NOT NULL REFERENCES items(id),
        quantity INTEGER NOT NULL DEFAULT 1,
        acquired TIMESTAMP NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMP
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS active_boosts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        boost_type TEXT NOT NULL,
        multiplier INTEGER NOT NULL,
        remaining_uses INTEGER,
        expires_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create lottery system
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS lottery_draws (
        id SERIAL PRIMARY KEY,
        draw_date TIMESTAMP NOT NULL,
        jackpot INTEGER NOT NULL DEFAULT 0,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        winning_ticket INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS lottery_tickets (
        id SERIAL PRIMARY KEY,
        draw_id INTEGER NOT NULL REFERENCES lottery_draws(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        ticket_number INTEGER NOT NULL,
        purchased TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create daily goals
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS daily_goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        goal_type TEXT NOT NULL,
        requirement INTEGER NOT NULL,
        progress INTEGER NOT NULL DEFAULT 0,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        reward INTEGER NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create jackpot pools
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS jackpot_pools (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        current_amount INTEGER NOT NULL DEFAULT 0,
        seed_amount INTEGER NOT NULL DEFAULT 10000,
        increment_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0025,
        last_won TIMESTAMP,
        winning_user_id INTEGER REFERENCES users(id),
        winning_amount INTEGER,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create multiplier games settings
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS multiplier_games (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        min_bet INTEGER NOT NULL DEFAULT 10,
        max_bet INTEGER NOT NULL DEFAULT 10000,
        house_edge DECIMAL(5,4) NOT NULL DEFAULT 0.0500,
        max_multiplier DECIMAL(10,2) NOT NULL DEFAULT 100.00,
        crash_chance_divisor DECIMAL(10,2) NOT NULL DEFAULT 33.33,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create free games tracking
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS free_games (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        game_type game_type NOT NULL,
        remaining_games INTEGER NOT NULL,
        multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00,
        bet_amount INTEGER NOT NULL,
        expires_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create real money transactions
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS real_money_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        transaction_type TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency_code TEXT NOT NULL DEFAULT 'USD',
        status TEXT NOT NULL,
        external_reference TEXT,
        details JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create indexes for performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_discord_id ON users(discord_id);
      CREATE INDEX IF NOT EXISTS idx_game_stats_user_id ON game_stats(user_id);
      CREATE INDEX IF NOT EXISTS idx_game_transactions_user_id ON game_transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_game_transactions_timestamp ON game_transactions(timestamp);
      CREATE INDEX IF NOT EXISTS idx_mining_profiles_user_id ON mining_profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_mining_inventory_user_id ON mining_inventory(user_id);
      CREATE INDEX IF NOT EXISTS idx_mining_units_user_id ON mining_units(user_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON inventory(user_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_item_id ON inventory(item_id);
      CREATE INDEX IF NOT EXISTS idx_active_boosts_user_id ON active_boosts(user_id);
      CREATE INDEX IF NOT EXISTS idx_lottery_tickets_draw_id ON lottery_tickets(draw_id);
      CREATE INDEX IF NOT EXISTS idx_lottery_tickets_user_id ON lottery_tickets(user_id);
      CREATE INDEX IF NOT EXISTS idx_daily_goals_user_id ON daily_goals(user_id);
      CREATE INDEX IF NOT EXISTS idx_daily_goals_expires_at ON daily_goals(expires_at);
      
      -- Indexes for new tables
      CREATE INDEX IF NOT EXISTS idx_jackpot_pools_winner_id ON jackpot_pools(winning_user_id);
      CREATE INDEX IF NOT EXISTS idx_jackpot_pools_active ON jackpot_pools(is_active);
      CREATE INDEX IF NOT EXISTS idx_free_games_user_id ON free_games(user_id);
      CREATE INDEX IF NOT EXISTS idx_free_games_expires ON free_games(expires_at);
      CREATE INDEX IF NOT EXISTS idx_multiplier_games_active ON multiplier_games(is_active);
      CREATE INDEX IF NOT EXISTS idx_real_money_transactions_user_id ON real_money_transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_real_money_transactions_status ON real_money_transactions(status);
    `);
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Execute the migrations
main().catch(console.error);