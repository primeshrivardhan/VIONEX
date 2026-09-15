import re

with open("src/components/AddProductForm.tsx", "r") as f:
    content = f.read()

# Make sure we clean up null values
content = content.replace("export function getEnrichedProduct(product: any) {", """export function getEnrichedProduct(product: any) {
  if (!product) return product;
  // Deep clean null values
  for (const key in product) {
    if (product[key] === null || product[key] === 'null' || product[key] === 'undefined' || product[key] === 'Data under processing') {
      product[key] = "";
    }
  }""")
  
with open("src/components/AddProductForm.tsx", "w") as f:
    f.write(content)
