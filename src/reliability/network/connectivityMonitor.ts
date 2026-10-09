// ============================================================
// Multi-Signal Network & Connectivity Monitor
// src/reliability/network/connectivityMonitor.ts
// ============================================================

import type { ConnectivityStatus } from '../types'

type ConnectivityListener = (status: ConnectivityStatus) => void

export class ConnectivityMonitor {
  private status: ConnectivityStatus = 'online'
  private listeners: Set<ConnectivityListener> = new Set()
  private heartbeatTimer: number | null = null
  private consecutiveFailures = 0
  private lastHeartbeatSuccess = Date.now()

  constructor() {
    if (typeof window !== 'undefined') {
      this.status = navigator.onLine ? 'online' : 'offline'
      window.addEventListener('online', this.handleOnlineEvent)
      window.addEventListener('offline', this.handleOfflineEvent)
      this.startHeartbeat()
    }
  }

  public getStatus(): ConnectivityStatus {
    return this.status
  }

  public isOnline(): boolean {
    return this.status === 'online'
  }

  public isOffline(): boolean {
    return this.status === 'offline'
  }

  public isDegraded(): boolean {
    return this.status === 'degraded'
  }

  public subscribe(listener: ConnectivityListener): () => void {
    this.listeners.add(listener)
    listener(this.status)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Report an API request failure to help detect degraded network conditions.
   */
  public reportRequestFailure(status?: number): void {
    if (status === 429 || (status && status >= 500) || status === 0) {
      this.consecutiveFailures++
      if (this.consecutiveFailures >= 3 && this.status !== 'offline') {
        this.updateStatus('degraded')
      }
    }
  }

  /**
   * Report an API request success to restore online state.
   */
  public reportRequestSuccess(): void {
    this.consecutiveFailures = 0
    this.lastHeartbeatSuccess = Date.now()
    if (this.status !== 'online' && navigator.onLine) {
      this.updateStatus('online')
    }
  }

  private handleOnlineEvent = (): void => {
    this.consecutiveFailures = 0
    this.updateStatus('online')
    this.checkLiveReachability()
  }

  private handleOfflineEvent = (): void => {
    this.updateStatus('offline')
  }

  private updateStatus(newStatus: ConnectivityStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus
      for (const listener of this.listeners) {
        try {
          listener(newStatus)
        } catch (e) {
          console.error('Error in connectivity listener:', e)
        }
      }
    }
  }

  /**
   * Performs an active, lightweight ping check to verify true internet access.
   */
  public async checkLiveReachability(): Promise<boolean> {
    if (typeof window === 'undefined' || !navigator.onLine) {
      this.updateStatus('offline')
      return false
    }

    try {
      // Use favicon / lightweight check with cache busting and short timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3500)

      const response = await fetch(`/favicon.ico?_t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      }).catch(() => null)

      clearTimeout(timeoutId)

      if (response && (response.ok || response.status === 304 || response.status === 404)) {
        this.reportRequestSuccess()
        return true
      }
    } catch {
      // Ignore ping failure
    }

    if (Date.now() - this.lastHeartbeatSuccess > 30_000 && navigator.onLine) {
      this.updateStatus('degraded')
    }
    return false
  }

  private startHeartbeat(): void {
    if (typeof window === 'undefined') return
    // Check reachability every 45s if online, or every 10s if degraded
    this.heartbeatTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.checkLiveReachability()
      }
    }, 45_000)
  }

  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnlineEvent)
      window.removeEventListener('offline', this.handleOfflineEvent)
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer)
      }
    }
    this.listeners.clear()
  }
}

export const connectivityMonitor = new ConnectivityMonitor()
