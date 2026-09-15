import sys

with open('src/components/LocationMapping.tsx') as f:
    content = f.read()

# 1. Split mappedData useMemo into groupedData and mappedData
old_memo = """  const mappedData = useMemo(() => {
    const locationsFromDealers = Object.values(uniqueLocationsMap);
    
    const relevantLocations = locationsFromDealers.filter(loc => {
      if (!currentTaluka) return true;
      const locTalNorm = (loc.taluka || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
      const currTalNorm = currentTaluka.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
      return locTalNorm === currTalNorm || locTalNorm.includes(currTalNorm) || currTalNorm.includes(locTalNorm);
    });

    const relevantDealers = (dealers || []).filter(d => {
      if (!d) return false;
      if (!currentTaluka) return true;
      const dTalNorm = (d.taluka || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
      const lTalNorm = currentTaluka.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
      return dTalNorm === lTalNorm || dTalNorm.includes(lTalNorm) || lTalNorm.includes(dTalNorm);
    });

    const grouped = relevantLocations.map((loc) => {
      const lVilNorm = (loc.village || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
      const lVilMarNorm = (loc.villageMarathi || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
      
      const villageDealers = relevantDealers.filter(d => {
        // Must match State, District, Taluka exactly (normalized) to avoid cross-taluka false matches
        const dStateNorm = (d.state || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
        const lStateNorm = (loc.state || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
        if (dStateNorm && lStateNorm && dStateNorm !== lStateNorm) return false;

        const dDistNorm = (d.district || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
        const lDistNorm = (loc.district || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
        if (dDistNorm && lDistNorm && dDistNorm !== lDistNorm) return false;

        const dTalNorm = (d.taluka || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
        const lTalNorm = (loc.taluka || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
        if (dTalNorm && lTalNorm && dTalNorm !== lTalNorm && !dTalNorm.includes(lTalNorm) && !lTalNorm.includes(dTalNorm)) return false;

        const dVilNorm = (d.village || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
        if (!dVilNorm) return false;
        
        // Exact matches
        if (dVilNorm === lVilNorm) return true;
        if (lVilMarNorm && dVilNorm === lVilMarNorm) return true;
        
        // Code match fallback
        if (d.villageCode && loc.villageCode && d.villageCode === loc.villageCode) return true;
        
        // Substring matches as fallback for slightly different spellings
        if (dVilNorm.length > 4 && lVilNorm.length > 4) {
          // If the length difference is greater than 3, they are likely different villages (e.g., Balvadi vs Balvadi Bhalvani)
          if (Math.abs(dVilNorm.length - lVilNorm.length) <= 3) {
            if (dVilNorm.includes(lVilNorm) || lVilNorm.includes(dVilNorm)) {
              // ONLY allow substring fallback if there is NO location in the entire list that matches this dealer EXACTLY
              const hasExactMatchInLocations = relevantLocations.some(otherLoc => {
                const otherLVilNorm = (otherLoc.village || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
                const otherLVilMarNorm = (otherLoc.villageMarathi || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
                
                if (dVilNorm === otherLVilNorm) return true;
                if (otherLVilMarNorm && dVilNorm === otherLVilMarNorm) return true;
                if (d.villageCode && otherLoc.villageCode && d.villageCode === otherLoc.villageCode) return true;
                return false;
              });
              
              if (!hasExactMatchInLocations) {
                return true;
              }
            }
          }
        }
        
        return false;
      });

      return {
        ...loc,
        villageDealers,
        status: villageDealers.length > 0 ? "mapped" : "pending",
        updatedAt: villageDealers.length > 0 ? Math.max(...villageDealers.map(d => d.updatedAt || 0)) : loc.updatedAt
      };
    });

    let filtered = grouped;"""

new_memo = """  const groupedData = useMemo(() => {
    const locationsFromDealers = Object.values(uniqueLocationsMap);
    
    const relevantLocations = locationsFromDealers.filter(loc => {
      if (!currentTaluka) return true;
      const locTalNorm = (loc.taluka || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
      const currTalNorm = currentTaluka.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
      return locTalNorm === currTalNorm || locTalNorm.includes(currTalNorm) || currTalNorm.includes(locTalNorm);
    });

    const relevantDealers = (dealers || []).filter(d => {
      if (!d) return false;
      if (!currentTaluka) return true;
      const dTalNorm = (d.taluka || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
      const lTalNorm = currentTaluka.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
      return dTalNorm === lTalNorm || dTalNorm.includes(lTalNorm) || lTalNorm.includes(dTalNorm);
    });

    const grouped = relevantLocations.map((loc) => {
      const lVilNorm = (loc.village || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
      const lVilMarNorm = (loc.villageMarathi || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
      
      const villageDealers = relevantDealers.filter(d => {
        // Must match State, District, Taluka exactly (normalized) to avoid cross-taluka false matches
        const dStateNorm = (d.state || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
        const lStateNorm = (loc.state || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
        if (dStateNorm && lStateNorm && dStateNorm !== lStateNorm) return false;

        const dDistNorm = (d.district || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
        const lDistNorm = (loc.district || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
        if (dDistNorm && lDistNorm && dDistNorm !== lDistNorm) return false;

        const dTalNorm = (d.taluka || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
        const lTalNorm = (loc.taluka || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
        if (dTalNorm && lTalNorm && dTalNorm !== lTalNorm && !dTalNorm.includes(lTalNorm) && !lTalNorm.includes(dTalNorm)) return false;

        const dVilNorm = (d.village || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
        if (!dVilNorm) return false;
        
        // Exact matches
        if (dVilNorm === lVilNorm) return true;
        if (lVilMarNorm && dVilNorm === lVilMarNorm) return true;
        
        // Code match fallback
        if (d.villageCode && loc.villageCode && d.villageCode === loc.villageCode) return true;
        
        // Substring matches as fallback for slightly different spellings
        if (dVilNorm.length > 4 && lVilNorm.length > 4) {
          if (Math.abs(dVilNorm.length - lVilNorm.length) <= 3) {
            if (dVilNorm.includes(lVilNorm) || lVilNorm.includes(dVilNorm)) {
              const hasExactMatchInLocations = relevantLocations.some(otherLoc => {
                const otherLVilNorm = (otherLoc.village || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
                const otherLVilMarNorm = (otherLoc.villageMarathi || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
                
                if (dVilNorm === otherLVilNorm) return true;
                if (otherLVilMarNorm && dVilNorm === otherLVilMarNorm) return true;
                if (d.villageCode && otherLoc.villageCode && d.villageCode === otherLoc.villageCode) return true;
                return false;
              });
              
              if (!hasExactMatchInLocations) {
                return true;
              }
            }
          }
        }
        
        return false;
      });

      return {
        ...loc,
        villageDealers,
        status: villageDealers.length > 0 ? "mapped" : "pending",
        updatedAt: villageDealers.length > 0 ? Math.max(...villageDealers.map(d => d.updatedAt || 0)) : loc.updatedAt
      };
    });

    return grouped;
  }, [uniqueLocationsMap, currentTaluka, dealers]);

  const mappedData = useMemo(() => {
    let filtered = groupedData;"""

content = content.replace(old_memo, new_memo)

# 2. Fix the dependency array of mappedData to use groupedData
old_deps = "}, [locations, dealers, searchQuery, statusFilter, selectedVillage, sortConfig, currentTaluka]);"
new_deps = "}, [groupedData, searchQuery, statusFilter, selectedVillage, sortConfig]);"
content = content.replace(old_deps, new_deps)

# 3. Use groupedData in handleExport
old_export = "if (mappedData.length === 0) return;\n    const flatData = mappedData.flatMap((row, idx) => {"
new_export = "if (groupedData.length === 0) return;\n    const flatData = groupedData.flatMap((row, idx) => {"
content = content.replace(old_export, new_export)

# 4. Use groupedData in the print loop
old_print_loop = "{mappedData.map((row, idx) => {"
new_print_loop = "{groupedData.map((row, idx) => {"
content = content.replace(old_print_loop, new_print_loop)

# 5. Fix Stats logic so the UI shows the real totals
old_stats = """  const stats = useMemo(() => {
    return {
      total: mappedData.length,
      mapped: mappedData.filter(l => l.status === 'mapped').length,
      pending: mappedData.filter(l => l.status === 'pending').length
    };
  }, [mappedData]);"""

new_stats = """  const stats = useMemo(() => {
    return {
      total: groupedData.length,
      mapped: groupedData.filter(l => l.status === 'mapped').length,
      pending: groupedData.filter(l => l.status === 'pending').length
    };
  }, [groupedData]);"""
content = content.replace(old_stats, new_stats)

with open('src/components/LocationMapping.tsx', 'w') as f:
    f.write(content)

