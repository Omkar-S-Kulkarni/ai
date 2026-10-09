// ============================================================
// Simulation Engine Storage Integration Interface
// src/reliability/services/simulationStorageService.ts
// ============================================================

import type { SimulationInputContext, SimulationRecord, DataFreshness } from '../types'
import { cacheStorage } from '../storage/cacheStorageService'
import { CACHE_NAMESPACES } from '../config/cachePolicies'
import type { PokemonDetails, GeocodingResult } from '@/types'

export interface SimulationQueryFilters {
  simulationType?: string
  pokemonId?: number
  minTimestamp?: number
  maxTimestamp?: number
  limit?: number
}

export interface ISimulationStorageService {
  requestCachedPokemonInput(nameOrId: string | number): Promise<{ data: PokemonDetails | null; freshness: DataFreshness }>
  requestCachedLocationInput(queryOrCoords: string): Promise<{ data: GeocodingResult | null; freshness: DataFreshness }>
  storeSimulationResult(
    simulationType: string,
    inputs: SimulationInputContext,
    results: Record<string, unknown>,
    engineVersion?: string,
    tags?: string[],
  ): Promise<SimulationRecord>
  getSimulationHistory(filters?: SimulationQueryFilters): Promise<SimulationRecord[]>
  getSimulationById(id: string): Promise<SimulationRecord | null>
  deleteSimulation(id: string): Promise<boolean>
  clearAllSimulations(): Promise<boolean>
  exportSimulationLogs(): Promise<string>
}

export class SimulationStorageService implements ISimulationStorageService {
  /**
   * Safe access for the simulation engine to retrieve cached Pokémon reference data.
   */
  public async requestCachedPokemonInput(
    nameOrId: string | number,
  ): Promise<{ data: PokemonDetails | null; freshness: DataFreshness }> {
    const key = `pokemon:detail:${String(nameOrId).toLowerCase()}`
    const { record, freshness } = await cacheStorage.get<PokemonDetails>(key, CACHE_NAMESPACES.POKEMON_DETAIL)
    return {
      data: record?.data ?? null,
      freshness: record ? freshness : 'offline-only',
    }
  }

  /**
   * Safe access for the simulation engine to retrieve previously selected location data.
   */
  public async requestCachedLocationInput(
    query: string,
  ): Promise<{ data: GeocodingResult | null; freshness: DataFreshness }> {
    const key = `geocoding:${query.trim().toLowerCase()}`
    const { record, freshness } = await cacheStorage.get<GeocodingResult>(key, CACHE_NAMESPACES.GEOCODING)
    return {
      data: record?.data ?? null,
      freshness: record ? freshness : 'offline-only',
    }
  }

  /**
   * Persistently stores a completed simulation record from the simulation engine.
   */
  public async storeSimulationResult(
    simulationType: string,
    inputs: SimulationInputContext,
    results: Record<string, unknown>,
    engineVersion = '1.0.0',
    tags?: string[],
  ): Promise<SimulationRecord> {
    const id = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const now = Date.now()

    // Determine input data freshness at time of run
    const pokemonCheck = await this.requestCachedPokemonInput(inputs.pokemonId || inputs.pokemonName)

    const record: SimulationRecord = {
      id,
      timestamp: now,
      simulationType,
      inputs,
      results,
      engineVersion,
      dataFreshnessAtRun: pokemonCheck.freshness,
      tags,
    }

    await cacheStorage.saveSimulation(record)
    return record
  }

  /**
   * Retrieves simulation history matching optional filters.
   */
  public async getSimulationHistory(filters: SimulationQueryFilters = {}): Promise<SimulationRecord[]> {
    const all = await cacheStorage.getSimulations()

    let filtered = all

    if (filters.simulationType) {
      filtered = filtered.filter((r) => r.simulationType === filters.simulationType)
    }

    if (filters.pokemonId !== undefined) {
      filtered = filtered.filter((r) => r.inputs.pokemonId === filters.pokemonId)
    }

    if (filters.minTimestamp !== undefined) {
      filtered = filtered.filter((r) => r.timestamp >= filters.minTimestamp!)
    }

    if (filters.maxTimestamp !== undefined) {
      filtered = filtered.filter((r) => r.timestamp <= filters.maxTimestamp!)
    }

    if (filters.limit && filters.limit > 0) {
      filtered = filtered.slice(0, filters.limit)
    }

    return filtered
  }

  /**
   * Retrieves a single simulation run by its ID.
   */
  public async getSimulationById(id: string): Promise<SimulationRecord | null> {
    const all = await cacheStorage.getSimulations()
    return all.find((r) => r.id === id) ?? null
  }

  /**
   * Deletes a single simulation record.
   */
  public async deleteSimulation(id: string): Promise<boolean> {
    return cacheStorage.deleteSimulation(id)
  }

  /**
   * Clears all saved simulation records.
   */
  public async clearAllSimulations(): Promise<boolean> {
    const all = await cacheStorage.getSimulations()
    for (const sim of all) {
      await cacheStorage.deleteSimulation(sim.id)
    }
    return true
  }

  /**
   * Export all simulation run history as formatted JSON string.
   */
  public async exportSimulationLogs(): Promise<string> {
    const history = await this.getSimulationHistory()
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        totalRuns: history.length,
        simulations: history,
      },
      null,
      2,
    )
  }
}

export const simulationStorage = new SimulationStorageService()
