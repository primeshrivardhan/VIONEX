import sys

with open('src/hooks/useMasterLocations.ts') as f:
    content = f.read()

content = content.replace(
    'const uniqueDataMap = new Map<string, MasterLocation>();',
    'const uniqueDataMap: Record<string, MasterLocation> = {};'
)
content = content.replace(
    'if (!uniqueDataMap.has(key)) {',
    'if (!uniqueDataMap[key]) {'
)
content = content.replace(
    'uniqueDataMap.set(key, loc);',
    'uniqueDataMap[key] = loc;'
)
content = content.replace(
    'data = Array.from(uniqueDataMap.values());',
    'data = Object.values(uniqueDataMap);'
)

with open('src/hooks/useMasterLocations.ts', 'w') as f:
    f.write(content)
