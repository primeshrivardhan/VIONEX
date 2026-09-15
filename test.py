import re
with open("src/components/AddProductForm.tsx", "r") as f:
    text = f.read()

# Already replaced nulls in previous step
print("export function getEnrichedProduct" in text)
