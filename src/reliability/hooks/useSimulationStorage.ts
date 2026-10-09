// ============================================================
// Simulation Storage Hook
// src/reliability/hooks/useSimulationStorage.ts
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import type { SimulationInputContext, SimulationRecord } from '../types'
import { simulationStorage, type SimulationQueryFilters } from '../services/simulationStorageService'

export function useSimulationStorage(filters?: SimulationQueryFilters) {
  const [history, setHistory] = useState<SimulationRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const reload = useCallback(async () => {
    setIsLoading(true)
    try {
      const records = await simulationStorage.getSimulationHistory(filters)
      setHistory(records)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    reload()
  }, [reload])

  const saveSimulation = useCallback(
    async (
      type: string,
      inputs: SimulationInputContext,
      results: Record<string, unknown>,
      version = '1.0.0',
      tags?: string[],
    ) => {
      const record = await simulationStorage.storeSimulationResult(type, inputs, results, version, tags)
      setHistory((prev) => [record, ...prev])
      return record
    },
    [],
  )

  const deleteSimulation = useCallback(async (id: string) => {
    const ok = await simulationStorage.deleteSimulation(id)
    if (ok) {
      setHistory((prev) => prev.filter((r) => r.id !== id))
    }
    return ok
  }, [])

  const clearAll = useCallback(async () => {
    const ok = await simulationStorage.clearAllSimulations()
    if (ok) {
      setHistory([])
    }
    return ok
  }, [])

  return {
    history,
    isLoading,
    reload,
    saveSimulation,
    deleteSimulation,
    clearAll,
  }
}
