import re

with open("src/lib/data-sync.ts", "r") as f:
    content = f.read()

content = content.replace("import { generate2500Catalog } from './catalog-generator';\n", "")
content = content.replace("const generatedCatalog = generate2500Catalog();", "const generatedCatalog: any[] = [];")

with open("src/lib/data-sync.ts", "w") as f:
    f.write(content)
