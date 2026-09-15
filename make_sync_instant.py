import sys

with open('src/lib/data-sync.ts') as f:
    content = f.read()

old_sync = """export function syncCollection<T>(
  collectionName: string, 
  callback: (data: T[]) => void,
  options?: { where?: [string, any, any], orderBy?: [string, 'asc' | 'desc'], limit?: number }
) {
  if (!activeListeners[collectionName]) {
    activeListeners[collectionName] = new Set();
  }
  activeListeners[collectionName].add(callback);

  let q: any = collection(db, collectionName);
  if (options?.where) {
    if (options.where[1] === "in" && (!Array.isArray(options.where[2]) || options.where[2].length === 0)) {
       callback([]); // No results possible
       return () => {
         activeListeners[collectionName]?.delete(callback);
       };
    }
    q = query(q, where(options.where[0], options.where[1], options.where[2]));
  }
  if (options?.orderBy) {
    q = query(q, orderBy(options.orderBy[0], options.orderBy[1]));
  }
  if (options?.limit) {
    q = query(q, limit(options.limit));
  }
  
  const unsubscribe = onSnapshot(q, (snapshot: any) => {
    const items = snapshot.docs.map((d: any) => {
      const origData = d.data();
      const cleanData: any = {};
      Object.keys(origData).forEach(key => {
        const val = origData[key];
        if (val && typeof val === 'object' && typeof val.toDate === 'function') {
          cleanData[key] = val.toDate().toISOString();
        } else {
          cleanData[key] = val;
        }
      });
      return { ...cleanData, id: d.id } as T;
    });
    callback(items);
  }, (error) => {
    console.warn(`Firestore snapshot issue for ${collectionName}:`, error);
  });
  
  return () => {
    activeListeners[collectionName]?.delete(callback);
    unsubscribe();
  };
}"""

new_sync = """export function syncCollection<T>(
  collectionName: string, 
  callback: (data: T[]) => void,
  options?: { where?: [string, any, any], orderBy?: [string, 'asc' | 'desc'], limit?: number }
) {
  if (!activeListeners[collectionName]) {
    activeListeners[collectionName] = new Set();
  }
  activeListeners[collectionName].add(callback);

  // IMMEDIATELY RETURN CACHED DATA FOR SUPERFAST OFFLINE LOAD
  const cacheKey = `vionex_cache_${collectionName}_${JSON.stringify(options || {})}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      callback(JSON.parse(cached));
    }
  } catch(e) {}

  let q: any = collection(db, collectionName);
  if (options?.where) {
    if (options.where[1] === "in" && (!Array.isArray(options.where[2]) || options.where[2].length === 0)) {
       callback([]); // No results possible
       return () => {
         activeListeners[collectionName]?.delete(callback);
       };
    }
    q = query(q, where(options.where[0], options.where[1], options.where[2]));
  }
  if (options?.orderBy) {
    q = query(q, orderBy(options.orderBy[0], options.orderBy[1]));
  }
  if (options?.limit) {
    q = query(q, limit(options.limit));
  }
  
  const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot: any) => {
    const items = snapshot.docs.map((d: any) => {
      const origData = d.data();
      const cleanData: any = {};
      Object.keys(origData).forEach(key => {
        const val = origData[key];
        if (val && typeof val === 'object' && typeof val.toDate === 'function') {
          cleanData[key] = val.toDate().toISOString();
        } else {
          cleanData[key] = val;
        }
      });
      return { ...cleanData, id: d.id } as T;
    });
    
    // Save to local storage for instant next load
    try {
      localStorage.setItem(cacheKey, JSON.stringify(items));
    } catch(e) {
      // ignore quota errors
    }
    callback(items);
  }, (error: any) => {
    console.warn(`Firestore snapshot issue for ${collectionName}:`, error);
  });
  
  return () => {
    activeListeners[collectionName]?.delete(callback);
    unsubscribe();
  };
}"""

content = content.replace(old_sync, new_sync)

with open('src/lib/data-sync.ts', 'w') as f:
    f.write(content)
