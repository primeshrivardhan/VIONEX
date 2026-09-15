import re

with open("src/lib/preseeded-products.ts", "r") as f:
    content = f.read()

# Fix Bayer Luna
content = content.replace('"brandName": "Bayer Luna"', '"brandName": "Luna Experience"')

# Standardize company names
replacements = {
    '"companyName": "Bayer"': '"companyName": "Bayer CropScience Limited"',
    '"companyName": "Syngenta"': '"companyName": "Syngenta India Limited"',
    '"companyName": "BASF"': '"companyName": "BASF India Limited"',
    '"companyName": "UPL"': '"companyName": "UPL Limited"',
    '"companyName": "FMC"': '"companyName": "FMC India Pvt. Ltd."',
    '"companyName": "Indofil"': '"companyName": "Indofil Industries Limited"',
    '"companyName": "Dhanuka"': '"companyName": "Dhanuka Agritech Limited"',
    '"companyName": "PI Industries"': '"companyName": "PI Industries Limited"',
    '"companyName": "Sumitomo"': '"companyName": "Sumitomo Chemical India Ltd."',
    '"companyName": "Adama"': '"companyName": "ADAMA India"',
    '"companyName": "Mahadhan"': '"companyName": "Mahadhan AgriTech Limited"',
    '"companyName": "Mahafeed"': '"companyName": "Mahafeed Speciality Fertilizers India Pvt. Ltd."',
    '"companyName": "Multiplex"': '"companyName": "Multiplex Group"',
    '"companyName": "Coromandel"': '"companyName": "Coromandel International Limited"',
    '"companyName": "Tata Rallis"': '"companyName": "Rallis India Limited"',
    '"companyName": "Rallis"': '"companyName": "Rallis India Limited"',
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Also clean up any Brand Names that might still have the company name prefix
# (e.g. "Bayer Nativo" if it existed, though I didn't see it yet)
# We will do this carefully for common patterns
companies_to_strip = ["Bayer ", "Syngenta ", "BASF ", "UPL ", "FMC ", "Indofil ", "Dhanuka ", "PI ", "Sumitomo ", "Adama ", "Mahadhan ", "Mahafeed ", "Multiplex "]
for prefix in companies_to_strip:
    # Match "brandName": "Prefix ... "
    content = re.sub(rf'"brandName": "{prefix}(.*?)"', r'"brandName": "\1"', content)

with open("src/lib/preseeded-products.ts", "w") as f:
    f.write(content)
