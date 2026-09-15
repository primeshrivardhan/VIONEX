import os
import re

for root, _, files in os.walk('src'):
    for file in files:
        if not file.endswith(('.ts', '.tsx')):
            continue
        filepath = os.path.join(root, file)
        with open(filepath, 'r') as f:
            content = f.read()
            # check if ` Map,` or `Map ` is in lucide import
            if re.search(r'import\s+\{[^}]*\bMap\b[^}]*\}\s+from\s+[\'"]lucide-react[\'"]', content):
                print(f"Found Map in lucide import: {filepath}")
