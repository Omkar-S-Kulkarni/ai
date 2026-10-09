// ============================================================
// Network Connectivity Hook
// src/reliability/hooks/useConnectivity.ts
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import type { ConnectivityStatus } from '../types'
import { connectivityMonitor } from '../network/connectivityMonitor'

export interface ConnectivityState {
  status: ConnectivityStatus
  isOnline: boolean
  isOffline: boolean
  isDegraded: boolean
  recheck: () => Promise<boolean>
}

export function useConnectivity(): ConnectivityState {
  const [status, setStatus] = useState<ConnectivityStatus>(() => connectivityMonitor.getStatus())

  useEffect(() => {
    return connectivityMonitor.subscribe((newStatus) => {
      setStatus(newStatus)
    })
  }, [])

  const recheck = useCallback(async () => {
    return connectivityMonitor.checkLiveReachability()
  }, [])

  return {
    status,
    isOnline: status === 'online',
    isOffline: status === 'offline',
    isDegraded: status === 'degraded',
    recheck,
  }
}
