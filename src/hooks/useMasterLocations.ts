import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, limit, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { saveItem, deleteAllItems } from '../lib/data-sync';
import { MasterLocation } from '../types';
import { ALL_STATES, DISTRICTS_BY_STATE, getTalukasForDistrict, getVillagesForTaluka, isVillageOfficialForTaluka, normalizeTalukaName } from '../lib/maharashtra-locations';
import { get, set, del, keys } from 'idb-keyval';
import { getApiUrl, getAuthHeaders } from '../lib/config';

export function normalizeVillageName(name: string): string {
  if (!name) return '';
  // Extract English part if in "English (Marathi)" format
  const englishMatch = name.match(/^([^\(]+)/);
  let base = englishMatch ? englishMatch[1] : name;
  // Strip non-alphanumeric, spaces, and handle casing, replacing W with V for phonetic consistency
  return base.replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase().replace(/W/g, 'V');
}

export function generateVillageCode(state: string, district: string, taluka: string, village: string): string {
  if (!state || !district || !taluka || !village) return '';
  
  const cleanStr = (str: string) => {
    return str.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().trim();
  };

  const stateCode = cleanStr(state).substring(0, 2);
  const distCode = cleanStr(district).substring(0, 3);
  const talCode = cleanStr(taluka).substring(0, 3);
  const vilCode = normalizeVillageName(village);
  
  if (!vilCode) return '';
  return `${stateCode}_${distCode}_${talCode}_${vilCode}`;
}

export function useMasterLocations() {
  const [locations, setLocations] = useState<MasterLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [cache, setCache] = useState<Record<string, MasterLocation[]>>({});
  const lastFetchRef = useRef<string>('');

  // Fetch only necessary locations (e.g., by district or taluka)
  const fetchLocations = useCallback(async (filter?: { state?: string, district?: string, taluka?: string }) => {
    const cacheKey = 'master_locations_v3_' + JSON.stringify(filter || 'all');
    lastFetchRef.current = cacheKey;
    
    // Check memory cache
    if (cache[cacheKey]) {
      if (lastFetchRef.current === cacheKey) setLocations(cache[cacheKey]);
      return;
    }

    // Check IndexedDB cache
    let hasLocalData = false;
    try {
      const localData = await get(cacheKey);
      if (localData && Array.isArray(localData) && localData.length > 0) {
        if (lastFetchRef.current === cacheKey) {
          setLocations(localData);
        }
        setCache(prev => ({ ...prev, [cacheKey]: localData }));
        hasLocalData = true;
      }
    } catch (e) {
      console.error('Error reading from IndexedDB', e);
    }

    if (!hasLocalData) {
      setLoading(true);
    }

    if (!db) {
      setLoading(false);
      return;
    }

    try {
      let q = query(collection(db, 'master-locations'));
      
      if (filter?.state) q = query(q, where('state', '==', filter.state));
      if (filter?.district) q = query(q, where('district', '==', filter.district));
      if (filter?.taluka) {
        const canonicalTaluka = normalizeTalukaName(filter.taluka);
        if (canonicalTaluka !== filter.taluka && canonicalTaluka) {
          q = query(q, where('taluka', 'in', [filter.taluka, canonicalTaluka]));
        } else {
          q = query(q, where('taluka', '==', filter.taluka));
        }
      }

      const snapshot = await getDocs(q);
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MasterLocation));
      
      // We only load what is stored in the database. No online Gemini API fetching or static fallbacks.

      // Self-Healing: Cross-Taluka and Duplicate Purge (Keep manual ones, only clean internal duplicates)
      const uniqueDataMap: Record<string, MasterLocation> = {};
      for (const loc of data) {
        const normTaluka = normalizeTalukaName(loc.taluka, loc.district);
        const key = `${loc.district}_${normTaluka}_${normalizeVillageName(loc.village)}`;
        if (!uniqueDataMap[key]) {
          // Auto-normalize taluka name in memory if it matches a variation
          if (loc.taluka !== normTaluka) {
            loc.taluka = normTaluka;
          }
          uniqueDataMap[key] = loc;
        } else {
           console.log(`[Self-Healing] Deleting internal duplicate "${loc.village}" in "${loc.taluka}"`);
           deleteDoc(doc(db, 'master-locations', loc.id)).catch(console.error);
        }
      }
      data = Object.values(uniqueDataMap);

      // Self-Healing: Re-add Balvadi and Balvadi Bhalvani villages if deleted for Khanapur (Vita)
      const hasBalvadi = data.some(l => 
        l.state === "Maharashtra" && 
        l.district === "Sangli" && 
        normalizeTalukaName(l.taluka) === "Khanapur" && 
        normalizeVillageName(l.village) === "BALVADI"
      );

      const hasBalvadiBhalvani = data.some(l => 
        l.state === "Maharashtra" && 
        l.district === "Sangli" && 
        normalizeTalukaName(l.taluka) === "Khanapur" && 
        normalizeVillageName(l.village) === "BALVADIBHALVANI"
      );

      const isKhanapurFilter = !filter?.taluka || normalizeTalukaName(filter.taluka) === "Khanapur";
      const isSangliFilter = !filter?.district || filter.district === "Sangli";

      if (!hasBalvadi && isKhanapurFilter && isSangliFilter) {
        console.log("[Self-Healing] Restoring Balvadi village under Khanapur (Vita)...");
        const code = generateVillageCode("Maharashtra", "Sangli", "Khanapur (Vita)", "Balvadi");
        const restoredLoc: MasterLocation = {
          id: code,
          villageCode: code,
          state: "Maharashtra",
          district: "Sangli",
          taluka: "Khanapur (Vita)",
          village: "Balvadi",
          villageMarathi: "बलवडी",
          updatedAt: Date.now()
        };
        // Save to Firestore asynchronously
        saveItem('master-locations', restoredLoc, code).catch(console.error);
        // Add to currently loaded data
        data.push(restoredLoc);
      }

      if (!hasBalvadiBhalvani && isKhanapurFilter && isSangliFilter) {
        console.log("[Self-Healing] Restoring Balvadi Bhalvani village under Khanapur (Vita)...");
        const code = generateVillageCode("Maharashtra", "Sangli", "Khanapur (Vita)", "Balvadi Bhalvani");
        const restoredLoc: MasterLocation = {
          id: code,
          villageCode: code,
          state: "Maharashtra",
          district: "Sangli",
          taluka: "Khanapur (Vita)",
          village: "Balvadi Bhalvani",
          villageMarathi: "बलवडी भाळवणी",
          updatedAt: Date.now()
        };
        // Save to Firestore asynchronously
        saveItem('master-locations', restoredLoc, code).catch(console.error);
        // Add to currently loaded data
        data.push(restoredLoc);
      }

      if (data.length > 0) {
        // Sort alphabetically
        data.sort((a, b) => a.village.localeCompare(b.village));

        if (lastFetchRef.current === cacheKey) {
          setLocations(data);
        }
        
        setCache(prev => {
          // Save to IndexedDB
          set(cacheKey, data).catch(err => console.error('Error saving to IndexedDB', err));
          return { ...prev, [cacheKey]: data };
        });
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
    } finally {
      setLoading(false);
    }
  }, [cache]);

  const clearMasterLocationsCache = async () => {
    try {
      const allKeys = await keys();
      for (const key of allKeys) {
        if (typeof key === 'string' && key.startsWith('master_locations_')) {
          await del(key);
        }
      }
    } catch (e) {
      console.error('Failed to clear MasterLocations cache:', e);
    }
  };

  const addLocations = async (newLocations: Omit<MasterLocation, 'id'>[]) => {
    for (const loc of newLocations) {
      const code = generateVillageCode(loc.state, loc.district, loc.taluka, loc.village);
      const fullLoc: MasterLocation = {
        ...loc,
        id: code,
        villageCode: code,
        updatedAt: Date.now()
      };
      await saveItem('master-locations', fullLoc, code);
    }
    setCache({});
    await clearMasterLocationsCache();
  };

  const clearAll = async () => {
    alert("Clearing large collections is restricted to avoid timeouts. Contact system admin.");
  };

  const deleteLocation = async (id: string) => {
    try {
      const docRef = doc(db, 'master-locations', id);
      await deleteDoc(docRef);
      // Local update
      setLocations(prev => prev.filter(l => l.id !== id));
      setCache({});
      await clearMasterLocationsCache();
      return true;
    } catch (e) {
      console.error("Error deleting location:", e);
      return false;
    }
  };

  const updateLocation = async (id: string, updatedName: string, meta?: { state: string, district: string, taluka: string }) => {
    try {
      let loc = locations.find(l => l.id === id);
      if (!loc) {
        if (!meta) {
          console.error("Missing metadata for creating custom master-location");
          return false;
        }
        loc = {
          id,
          villageCode: id,
          state: meta.state,
          district: meta.district,
          taluka: meta.taluka,
          village: updatedName,
          updatedAt: Date.now()
        };
      } else {
        loc = {
          ...loc,
          village: updatedName,
          updatedAt: Date.now()
        };
      }
      
      await saveItem('master-locations', loc, id);
      
      setLocations(prev => {
        const exists = prev.some(l => l.id === id);
        if (exists) {
          return prev.map(l => l.id === id ? loc! : l);
        } else {
          return [...prev, loc!];
        }
      });
      setCache({});
      await clearMasterLocationsCache();
      return true;
    } catch (e) {
      console.error("Error updating location:", e);
      return false;
    }
  };

  const revalidateTalukaOfficial = async (state: string, district: string, taluka: string) => {
    const apiUrl = getApiUrl('/api/taluka-villages');
    if (!apiUrl || !db) {
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ state, district, taluka })
      });
      
      const result = await response.json();
      if (result.villages && Array.isArray(result.villages)) {
        // 1. Clear OLD entries for this taluka in Firestore
        const oldEntries = locations.filter(l => 
          l.state === state && l.district === district && l.taluka === taluka
        );
        
        for (const old of oldEntries) {
          await deleteDoc(doc(db, 'master-locations', old.id));
        }

        // 2. Save NEW official entries
        for (const vName of result.villages) {
          // Strict boundary validation: Ensure village doesn't officially belong to a different taluka
          const isOfficial = isVillageOfficialForTaluka(vName, taluka);
          if (!isOfficial) {
            console.log(`[Validation] Skipping official revalidate of "${vName}" because it is not in the official list`);
            continue;
          }

          const vCode = generateVillageCode(state, district, taluka, vName);
          if (!vCode) continue;
          
          const loc: MasterLocation = {
            id: vCode,
            villageCode: vCode,
            state,
            district,
            taluka,
            village: vName,
            updatedAt: Date.now()
          };
          await saveItem('master-locations', loc, vCode);
        }

        // 3. Refresh
        await fetchLocations({ state, district, taluka });
        return true;
      }
      return false;
    } catch (e) {
      console.error("Revalidation failed:", e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    locations,
    loading,
    addLocations,
    clearAll,
    fetchLocations,
    deleteLocation,
    updateLocation,
    revalidateTalukaOfficial,
    // Helpers for UI
    getStates: () => ALL_STATES,
    getDistricts: (state: string) => {
      return DISTRICTS_BY_STATE[state] || [];
    },
    getTalukas: (district: string) => {
      return getTalukasForDistrict(district);
    }
  };
}
