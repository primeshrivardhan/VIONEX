import sys

with open('src/components/LocationMapping.tsx') as f:
    content = f.read()

content = content.replace(
    'const uniqueLocationsMap = new Map<string, any>();',
    'const uniqueLocationsMap: Record<string, any> = {};'
)
content = content.replace(
    'if (!uniqueLocationsMap.has(code)) {',
    'if (!uniqueLocationsMap[code]) {'
)
content = content.replace(
    'uniqueLocationsMap.set(code, {',
    'uniqueLocationsMap[code] = {'
)
content = content.replace(
    'const locationsFromDealers = Array.from(uniqueLocationsMap.values());',
    'const locationsFromDealers = Object.values(uniqueLocationsMap);'
)

with open('src/components/LocationMapping.tsx', 'w') as f:
    f.write(content)
