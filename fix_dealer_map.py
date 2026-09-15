import sys

with open('src/components/LocationMapping.tsx') as f:
    content = f.read()

content = content.replace(
    'dealers.forEach(d => {',
    '(dealers || []).forEach(d => {'
)

content = content.replace(
    'const code = d.villageCode || `${d.district}_${d.taluka}_${d.village}`;',
    'if (!d) return;\n       const code = d.villageCode || `${d.district || \'\'}_${d.taluka || \'\'}_${d.village || \'\'}`;'
)

with open('src/components/LocationMapping.tsx', 'w') as f:
    f.write(content)
