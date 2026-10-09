// ============================================================
// In-Flight Request Deduplicator
// src/reliability/network/requestDeduplicator.ts
// ============================================================

export class RequestDeduplicator {
  private inFlight = new Map<string, Promise<unknown>>()

  /**
   * Executes a factory function or joins an existing in-flight Promise for the given key.
   */
  public async deduplicate<T>(key: string, factory: () => Promise<T>): Promise<T> {
    if (this.inFlight.has(key)) {
      return this.inFlight.get(key) as Promise<T>
    }

    const promise = factory()
      .then((result) => {
        this.inFlight.delete(key)
        return result
      })
      .catch((error) => {
        this.inFlight.delete(key)
        throw error
      })

    this.inFlight.set(key, promise)
    return promise
  }

  /**
   * Returns true if a request with the specified key is currently in-flight.
   */
  public has(key: string): boolean {
    return this.inFlight.has(key)
  }

  /**
   * Clears in-flight promises.
   */
  public clear(): void {
    this.inFlight.clear()
  }

  /**
   * Returns the count of currently active in-flight requests.
   */
  public get activeCount(): number {
    return this.inFlight.size
  }
}

export const requestDeduplicator = new RequestDeduplicator()
