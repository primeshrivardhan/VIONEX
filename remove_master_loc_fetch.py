import sys
import re

with open('src/hooks/useMasterLocations.ts') as f:
    content = f.read()

# Make fetchLocations optional or don't fetch automatically if no filter is provided
old_logic = """  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);"""

new_logic = """  // Only auto-fetch if we are explicitly asking for a subset, or if we actually need the master locations.
  // We disable auto-fetching all locations to prevent 40,000+ village fetches crashing the app.
  useEffect(() => {
    // We will no longer auto-fetch all locations on mount. 
    // fetchLocations must be called manually with a filter if needed.
  }, [fetchLocations]);"""

content = content.replace(old_logic, new_logic)

with open('src/hooks/useMasterLocations.ts', 'w') as f:
    f.write(content)
