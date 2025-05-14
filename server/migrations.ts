import { db } from './db';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    console.log('Starting database migrations...');
    
    // Push schema changes to database
    await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm;`.execute(db);
    
    console.log('Creating enums...');
    
    // Create enums
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'game_type') THEN
          CREATE TYPE game_type AS ENUM (
            'blackjack', 'coinflip', 'crash', 'slots', 'roulette', 'dice',
            'race', 'roll', 'sevens', 'connectfour', 'tictactoe', 'higherorlower',
            'poker', 'rockpaperscissors', 'findthelady'
          );
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'outcome') THEN
          CREATE TYPE outcome AS ENUM (
            'win', 'loss', 'tie', 'crash', 'abort', 'pending'
          );
        END IF;
      END $$;
    `.execute(db);
    
    console.log('Creating tables...');
    
    // Create tables
    
    // Users table
    await sql`
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
    `.execute(db);
    
    // Game stats table
    await sql`
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
    `.execute(db);
    
    // Game transactions table
    await sql`
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
    `.execute(db);
    
    // Create mining system tables
    await sql`
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
    `.execute(db);
    
    // Create items and inventory system
    await sql`
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
      
      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        item_id INTEGER NOT NULL REFERENCES items(id),
        quantity INTEGER NOT NULL DEFAULT 1,
        acquired TIMESTAMP NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS active_boosts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        boost_type TEXT NOT NULL,
        multiplier INTEGER NOT NULL,
        remaining_uses INTEGER,
        expires_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `.execute(db);
    
    // Create lottery system
    await sql`
      CREATE TABLE IF NOT EXISTS lottery_draws (
        id SERIAL PRIMARY KEY,
        draw_date TIMESTAMP NOT NULL,
        jackpot INTEGER NOT NULL DEFAULT 0,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        winning_ticket INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS lottery_tickets (
        id SERIAL PRIMARY KEY,
        draw_id INTEGER NOT NULL REFERENCES lottery_draws(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        ticket_number INTEGER NOT NULL,
        purchased TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `.execute(db);
    
    // Create daily goals
    await sql`
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
    `.execute(db);
    
    // Create indexes for performance
    await sql`
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
    `.execute(db);
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Execute the migrations
main().catch(console.error);