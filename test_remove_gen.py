import re

with open("src/components/AddProductForm.tsx", "r") as f:
    content = f.read()

content = content.replace('import { generate2500Catalog } from "../lib/catalog-generator";\n', '')
content = content.replace('const CATALOG_PRODUCTS = generate2500Catalog();\n', 'const CATALOG_PRODUCTS: any[] = [];\n')

with open("src/components/AddProductForm.tsx", "w") as f:
    f.write(content)
