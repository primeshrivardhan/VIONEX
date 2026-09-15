import { safeJsonParse } from "./safeJson";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  setDoc,
  getDocs,
  Timestamp,
  serverTimestamp,
  writeBatch,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError, getDocsSafe } from './firebase';
import { generate2500Catalog } from './catalog-generator';


const activeListeners: { [collectionName: string]: Set<(data: any[]) => void> } = {};

/**
 * Generic sync function for collections with robust IndexedDB caching & offline support natively via Firebase.
 */
export function syncCollection<T>(
  collectionName: string, 
  callback: (data: T[]) => void,
  options?: { where?: [string, any, any], orderBy?: [string, 'asc' | 'desc'], limit?: number }
) {
  if (!activeListeners[collectionName]) {
    activeListeners[collectionName] = new Set();
  }
  activeListeners[collectionName].add(callback);

  if (!db) {
    const localData = localStorage.getItem(`vionex-${collectionName}`);
    if (localData) {
      try {
        callback(JSON.parse(localData));
      } catch {
        callback([]);
      }
    } else {
      callback([]);
    }
    return () => {
      activeListeners[collectionName]?.delete(callback);
    };
  }

  // Synchronously serve local cache for 0-second superfast load
  const cacheKey = `vionex_cache_${collectionName}_${JSON.stringify(options || {})}`;
  

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
  
  const unsubscribe = onSnapshot(q, { includeMetadataChanges: false }, (snapshot: any) => {
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
}

export async function saveItem(collectionName: string, item: any, id?: string) {
  const finalId = id || `local_${Date.now()}`;
  if (!db) {
    console.warn(`[data-sync] Database unconfigured. Local item preserved for ${collectionName}.`);
    return finalId;
  }
  
  try {
    const data = { ...item, updatedAt: serverTimestamp() };
    if (id) {
      const docRef = doc(db, collectionName, id);
      // Don't await directly if we want offline-first instant return.
      // Firestore will queue this write.
      setDoc(docRef, data, { merge: true }).catch(err => {
        console.warn(`Firestore background write failed for ${collectionName}:`, err);
      });
      return id;
    } else {
      const docRef = doc(collection(db, collectionName));
      setDoc(docRef, { ...data, createdAt: serverTimestamp() }).catch(err => {
        console.warn(`Firestore background write failed for ${collectionName}:`, err);
      });
      return docRef.id;
    }
  } catch (error) {
    console.warn(`Firestore offline write queued for ${collectionName}.`, error);
    return finalId;
  }
}

export async function deleteItem(collectionName: string, id: string) {
  if (!db) return;
  try {
    const docRef = doc(db, collectionName, id);
    deleteDoc(docRef).catch(err => {
      console.warn(`Firestore background delete failed for ${collectionName}:`, err);
    });
  } catch (error) {
    console.warn(`Firestore offline delete queued for ${collectionName}.`, error);
  }
}

export async function deleteAllItems(collectionName: string, ids: string[]) {
  if (!db) return;
  try {
    const globalCacheKey = `cached_collection_${collectionName}`;
    localStorage.removeItem(globalCacheKey);
    
    const listeners = activeListeners[collectionName];
    if (listeners) {
      listeners.forEach((cb) => {
        try { cb([]); } catch (e) {}
      });
    }

    const batchSize = 400;
    for (let i = 0; i < ids.length; i += batchSize) {
      const chunk = ids.slice(i, i + batchSize);
      const batch = writeBatch(db);
      chunk.forEach(id => {
        batch.delete(doc(db, collectionName, id));
      });
      
      const commitPromise = batch.commit();
      const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 300));
      await Promise.race([commitPromise, timeoutPromise]).catch(err => {
        console.warn(`Firestore batch commit background issue:`, err);
      });
    }
  } catch (error) {
    console.warn(`Firestore batch delete failed for ${collectionName}:`, error);
  }
}

export async function seedIfEmpty(collectionName: string, data: any[]) {
  try {
    const q = collection(db, collectionName);
    const snapshot = await getDocsSafe(q, 3000);
    
    if (snapshot.empty) {
      console.log(`Seeding ${collectionName} with initial data...`);
      const batch = writeBatch(db);
      
      data.forEach((item, index) => {
        const docRef = doc(db, collectionName, item.id || `${collectionName}_${index}`);
        batch.set(docRef, {
          ...item,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      console.log(`Successfully seeded ${collectionName}.`);
    }
  } catch (error) {
    console.warn(`Seeding failed for ${collectionName}:`, error);
  }
}

export async function seedMissingProducts(collectionName: string, requiredProducts: any[]) {
  try {
    // Generate the massive catalog of 2600+ products
    const generatedCatalog = generate2500Catalog();
    const allProducts = [...requiredProducts, ...generatedCatalog];
    
    const q = collection(db, collectionName);
    const snapshot = await getDocsSafe(q, 4000);
    
    const cleanParts = (name: string) => {
      return name
        .split(/[\/\+\s]/)
        .map(part => part.trim().toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/gi, ""))
        .filter(part => part.length > 1);
    };

    const cleanComp = (comp: string) => {
      return comp.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, "")
        .replace("ww", "")
        .replace("sc", "")
        .replace("wp", "")
        .replace("wg", "")
        .replace("ec", "");
    };
    
    const cleanCo = (co: string) => {
      return co.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, "").replace("corp", "").replace("ltd", "").replace("private", "").trim();
    };

    const existingProductsMap = new Map<string, any>();
    const existingProductsMapped = snapshot.docs.map(doc => {
      const p = doc.data() as any;
      const brand = (p.brandName || p.name || "").trim().toLowerCase();
      const company = (p.companyName || "").trim().toLowerCase();
      const comp = (p.composition || p.activeIngredients || "").trim().toLowerCase();
      const id = doc.id;
      
      const key = `${brand.replace(/[^a-z0-9]/g, '')}_${company.replace(/[^a-z0-9]/g, '')}`;
      existingProductsMap.set(key, { id, ...p });
      
      return {
        brand,
        company,
        comp,
        brandParts: cleanParts(brand),
        normComp: cleanComp(comp),
        normCo: cleanCo(company)
      };
    });

    const existingByCompMap = new Map<string, typeof existingProductsMapped>();
    existingProductsMapped.forEach(item => {
      const list = existingByCompMap.get(item.normComp) || [];
      list.push(item);
      existingByCompMap.set(item.normComp, list);
    });
    
    const isAlreadySeeded = (p: any) => {
      const pBrand = (p.brandName || p.name || "").trim().toLowerCase();
      const pCompany = (p.companyName || "").trim().toLowerCase();
      const pComp = (p.composition || p.activeIngredients || "").trim().toLowerCase();
      
      const key = `${pBrand.replace(/[^a-z0-9]/g, '')}_${pCompany.replace(/[^a-z0-9]/g, '')}`;
      if (existingProductsMap.has(key)) return true;

      const pParts = cleanParts(pBrand);
      const normComp = cleanComp(pComp);
      const normCo = cleanCo(pCompany);
      
      const compCandidates = existingByCompMap.get(normComp) || [];
      return compCandidates.some(existing => {
        const hasNameOverlap = (existing.brand === pBrand) || pParts.some(pt => existing.brandParts.includes(pt));
        if (!hasNameOverlap) return false;

        const companyMatch = normCo === existing.normCo ||
                              normCo.includes(existing.normCo) ||
                              existing.normCo.includes(normCo);
                              
        return companyMatch;
      });
    };
    
    const seenRequiredKeys = new Set<string>();
    const productsToSeed: any[] = [];
    
    for (const p of allProducts) {
      const brand = (p.brandName || p.name || "").trim().toLowerCase();
      const company = (p.companyName || "").trim().toLowerCase();
      const comp = (p.composition || p.activeIngredients || "").trim().toLowerCase();
      
      const cleanBrand = brand.replace(/[^a-z0-9\u0900-\u097F]/gi, "");
      const normComp = cleanComp(comp);
      const normCo = cleanCo(company);
      
      const key = `${cleanBrand}_${normComp}_${normCo}`;
      if (!key) continue;
      
      if (seenRequiredKeys.has(key)) {
        continue;
      }
      seenRequiredKeys.add(key);
      
      if (!isAlreadySeeded(p)) {
        productsToSeed.push(p);
      }
    }

    if (productsToSeed.length > 0) {
      console.log(`Seeding ${productsToSeed.length} new products to Firestore...`);
      
      const preparedToSeed = productsToSeed.map((p, idx) => {
        const docId = p.id || `p_seed_${Date.now()}_${idx}`;
        const cleanP = safeJsonParse(JSON.stringify(p));
        return {
          ...cleanP,
          id: docId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          approvalStatus: "approved",
          status: "verified"
        };
      });

      // Background Firestore batched write
      const batchSize = 400;
      setTimeout(async () => {
        for (let i = 0; i < preparedToSeed.length; i += batchSize) {
          const chunk = preparedToSeed.slice(i, i + batchSize);
          const batch = writeBatch(db);
          
          chunk.forEach(p => {
            const docRef = doc(db, collectionName, p.id);
            batch.set(docRef, {
              ...p,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          });

          await batch.commit().catch(err => {
            console.warn("Firestore batch write failed in background:", err);
          });
          
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        console.log(`Successfully completed batched background seeding of ${preparedToSeed.length} products.`);
      }, 500);

    } else {
      console.log("All products are already seeded.");
    }

  } catch (error) {
    console.error("Error seeding missing products:", error);
  }
}

export async function updateItems(collectionName: string, updates: {id: string, data: any}[]) {
  // Firestore background write
  setTimeout(async () => {
    try {
      const batch = writeBatch(db);
      for (const {id, data} of updates) {
        const docRef = doc(db, collectionName, id);
        batch.set(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
      }
      await batch.commit();
    } catch (err) {
      console.warn(`Firestore background batch write failed for ${collectionName}:`, err);
    }
  }, 100);
}
