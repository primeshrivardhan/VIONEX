import sys

with open('src/components/LocationMapping.tsx') as f:
    content = f.read()

old_logic = """    // Single Source of Truth: Derive locations directly from dealers
    const uniqueLocationsMap: Record<string, any> = {};
    (dealers || []).forEach(d => {
       if (!d) return;
       const code = d.villageCode || `${d.district || ''}_${d.taluka || ''}_${d.village || ''}`;
       if (!uniqueLocationsMap[code]) {
         uniqueLocationsMap[code] = {
           id: code,
           villageCode: code,
           state: d.state || "Maharashtra",
           district: d.district,
           taluka: d.taluka,
           village: d.village,
           updatedAt: d.updatedAt || Date.now()
         };
       }
    });
    const locationsFromDealers = Object.values(uniqueLocationsMap);"""

new_logic = """    // Combine locations from master database and dealers to ensure no missing data
    const uniqueLocationsMap: Record<string, any> = {};
    
    // First, add all master locations for this taluka/district
    (locations || []).forEach(loc => {
       if (!loc) return;
       const code = loc.villageCode || `${loc.district || ''}_${loc.taluka || ''}_${loc.village || ''}`;
       if (!uniqueLocationsMap[code]) {
         uniqueLocationsMap[code] = {
           id: code,
           villageCode: code,
           state: loc.state || "Maharashtra",
           district: loc.district,
           taluka: loc.taluka,
           village: loc.village,
           villageMarathi: loc.villageMarathi,
           updatedAt: loc.updatedAt || Date.now()
         };
       }
    });

    // Then, add any extra locations that might only exist in dealers data
    (dealers || []).forEach(d => {
       if (!d) return;
       const code = d.villageCode || `${d.district || ''}_${d.taluka || ''}_${d.village || ''}`;
       if (!uniqueLocationsMap[code]) {
         uniqueLocationsMap[code] = {
           id: code,
           villageCode: code,
           state: d.state || "Maharashtra",
           district: d.district,
           taluka: d.taluka,
           village: d.village,
           updatedAt: d.updatedAt || Date.now()
         };
       }
    });
    const locationsFromDealers = Object.values(uniqueLocationsMap);"""

content = content.replace(old_logic, new_logic)

with open('src/components/LocationMapping.tsx', 'w') as f:
    f.write(content)
