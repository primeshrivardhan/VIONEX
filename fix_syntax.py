import sys

with open('src/components/LocationMapping.tsx') as f:
    content = f.read()

content = content.replace(
    '           updatedAt: d.updatedAt || Date.now()\n         });\n       }',
    '           updatedAt: d.updatedAt || Date.now()\n         };\n       }'
)

with open('src/components/LocationMapping.tsx', 'w') as f:
    f.write(content)
