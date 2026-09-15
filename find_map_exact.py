import os
import re

for root, _, files in os.walk('src'):
    for file in files:
        if not file.endswith(('.ts', '.tsx')):
            continue
        filepath = os.path.join(root, file)
        with open(filepath, 'r') as f:
            content = f.read()
            match = re.search(r'import\s+\{([^}]*)\}\s+from\s+[\'"]lucide-react[\'"]', content, re.DOTALL)
            if match:
                imports = match.group(1)
                tokens = [t.strip() for t in imports.split(',')]
                if 'Map' in tokens:
                    print(f"EXACT Map in lucide import: {filepath}")
