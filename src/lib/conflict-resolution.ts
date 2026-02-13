/**
 * Conflict Resolution for Offline Sync
 * Handles merge conflicts when local offline data conflicts with server data
 */

export type ConflictResolutionStrategy = 'server' | 'client' | 'merge' | 'manual';

export interface ConflictItem {
  id: string;
  localVersion: any;
  serverVersion: any;
  localTimestamp: number;
  serverTimestamp: number;
}

/**
 * Resolve conflicts based on strategy
 */
export function resolveConflict(
  conflict: ConflictItem,
  strategy: ConflictResolutionStrategy = 'server'
): any {
  switch (strategy) {
    case 'server':
      return resolveServerWins(conflict);
    case 'client':
      return resolveClientWins(conflict);
    case 'merge':
      return resolveMerge(conflict);
    case 'manual':
      // Return both versions for manual resolution
      return { conflict: true, local: conflict.localVersion, server: conflict.serverVersion };
    default:
      return resolveServerWins(conflict);
  }
}

/**
 * Server wins strategy - discard local changes
 */
export function resolveServerWins(conflict: ConflictItem): any {
  return conflict.serverVersion;
}

/**
 * Client wins strategy - keep local changes
 */
export function resolveClientWins(conflict: ConflictItem): any {
  return conflict.localVersion;
}

/**
 * Merge strategy - intelligently merge both versions
 */
export function resolveMerge(conflict: ConflictItem): any {
  const local = conflict.localVersion;
  const server = conflict.serverVersion;

  // If both are objects, do deep merge
  if (typeof local === 'object' && typeof server === 'object') {
    return deepMerge(server, local);
  }

  // For primitives, use most recent (timestamps)
  if (conflict.localTimestamp > conflict.serverTimestamp) {
    return local;
  }
  return server;
}

/**
 * Deep merge two objects (server as base, local as overlay)
 */
export function deepMerge<T>(server: T, local: T): T {
  if (Array.isArray(server) && Array.isArray(local)) {
    // For arrays, merge by unique identifiers if available
    return mergeArrays(server, local) as T;
  }

  if (typeof server === 'object' && typeof local === 'object' && server !== null && local !== null) {
    const result = { ...server };

    for (const key in local) {
      if (Object.prototype.hasOwnProperty.call(local, key)) {
        const localValue = local[key];
        const serverValue = server[key];

        if (typeof localValue === 'object' && typeof serverValue === 'object') {
          result[key] = deepMerge(serverValue, localValue);
        } else if (localValue !== undefined) {
          result[key] = localValue;
        }
      }
    }

    return result as T;
  }

  return local;
}

/**
 * Merge arrays with ID-based deduplication
 */
function mergeArrays<T extends { id?: string | number }>(server: T[], local: T[]): T[] {
  const map = new Map<string | number, T>();

  // Add all server items first
  for (const item of server) {
    if (item.id) {
      map.set(item.id, item);
    }
  }

  // Override with local items (local changes take precedence)
  for (const item of local) {
    if (item.id) {
      map.set(item.id, item);
    } else {
      // Items without ID are considered new
      map.set(Math.random().toString(), item);
    }
  }

  return Array.from(map.values());
}

/**
 * Detect conflicts between local and server data
 */
export function detectConflicts<T extends { id: string }>(
  localData: T[],
  serverData: T[],
  fields: (keyof T)[] = Object.keys({}) as (keyof T)[]
): ConflictItem[] {
  const conflicts: ConflictItem[] = [];

  for (const localItem of localData) {
    const serverItem = serverData.find(s => s.id === localItem.id);

    if (!serverItem) {
      // Local item doesn't exist on server - possible conflict
      continue;
    }

    // Check if fields have diverged
    for (const field of fields) {
      if (localItem[field] !== serverItem[field]) {
        conflicts.push({
          id: localItem.id,
          localVersion: localItem,
          serverVersion: serverItem,
          localTimestamp: (localItem as any).updatedAt || Date.now(),
          serverTimestamp: (serverItem as any).updatedAt || Date.now(),
        });
        break;
      }
    }
  }

  return conflicts;
}

/**
 * Apply conflict resolution to multiple items
 */
export function resolveConflicts(
  conflicts: ConflictItem[],
  strategy: ConflictResolutionStrategy = 'server'
): Map<string, any> {
  const resolved = new Map<string, any>();

  for (const conflict of conflicts) {
    resolved.set(conflict.id, resolveConflict(conflict, strategy));
  }

  return resolved;
}

/**
 * Merge conflict resolutions back into dataset
 */
export function applyResolutions<T extends { id: string }>(
  data: T[],
  resolutions: Map<string, any>
): T[] {
  return data.map(item => {
    if (resolutions.has(item.id)) {
      return { ...item, ...resolutions.get(item.id) };
    }
    return item;
  });
}
