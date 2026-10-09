// ============================================================
// Simulation Type Contracts (Future Phase)
// src/types/simulation.ts
// ============================================================
// These define data contracts ONLY.
// The competition engine and simulation UI are NOT implemented here.
// These interfaces establish the shapes expected by future components.

import type { PokemonDetails, PokemonType } from './pokemon'
import type { IpGeolocationResult } from './geolocation'

// ------------------------------------------------------------------
// Competitor
// ------------------------------------------------------------------
export interface Competitor {
  id: string
  /** Trainer/player display name */
  trainerName: string
  /** Their selected Pokémon team */
  team: CompetitorPokemon[]
  /** Approximate location from IP geolocation */
  location: Pick<IpGeolocationResult, 'city' | 'countryCode' | 'lat' | 'lon'> | null
  rating: number
  wins: number
  losses: number
  joinedAt: string
}

export interface CompetitorPokemon {
  pokemon: Pick<PokemonDetails, 'id' | 'name' | 'displayName' | 'types' | 'stats' | 'sprites'>
  level: number
  nickname: string | null
  isShiny: boolean
}

// ------------------------------------------------------------------
// Battle / Simulation Result
// ------------------------------------------------------------------
export type BattleOutcome = 'win' | 'loss' | 'draw'

export interface SimulationTurn {
  turnNumber: number
  attackerName: string
  defenderName: string
  moveName: string
  damageDealt: number
  effectiveness: number  // 0 | 0.5 | 1 | 2 | 4
  isCritical: boolean
  remainingHp: { attacker: number; defender: number }
  message: string
}

export interface SimulationResult {
  id: string
  timestamp: string
  durationMs: number
  participant1: Competitor
  participant2: Competitor
  winner: Competitor | null  // null = draw
  outcome: BattleOutcome
  turns: SimulationTurn[]
  totalDamageDealt: { participant1: number; participant2: number }
  typeAdvantages: { participant1: PokemonType[]; participant2: PokemonType[] }
}

// ------------------------------------------------------------------
// Leaderboard
// ------------------------------------------------------------------
export interface CompetitorRanking {
  rank: number
  competitor: Competitor
  score: number
  winRate: number  // 0–1
  recentResults: BattleOutcome[]
  lastActive: string
  /** World region derived from IP geolocation */
  region: string | null
}

export interface Leaderboard {
  season: string
  updatedAt: string
  rankings: CompetitorRanking[]
}

// ------------------------------------------------------------------
// World Simulation State (Future)
// ------------------------------------------------------------------
export type SimulationStatus = 'idle' | 'initializing' | 'running' | 'paused' | 'completed' | 'error'

export interface WorldSimulationState {
  status: SimulationStatus
  tick: number
  activeBattles: SimulationResult[]
  leaderboard: Leaderboard | null
  error: string | null
}
