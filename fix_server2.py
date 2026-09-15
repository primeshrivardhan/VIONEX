import re

with open("server.ts", "r") as f:
    content = f.read()

# Replace the search prompt and system instructions to be extremely strict about official products
new_prompt = """const prompt = `Search for OFFICIAL and AUTHENTIC agricultural products associated with the query: "${cleanQuery}". 
CRITICAL INSTRUCTIONS:
1. Return ONLY the official, trademarked products manufactured by the exact company if a company is queried. 
2. DO NOT return generic NPKs, fertilizers, or micronutrients assigned to a company unless it is their official branded product.
3. If the exact product or company does not exist, return an empty array []. DO NOT make up or guess products.
4. Fill ALL fields correctly. Do not leave 'null' or empty strings if information is available.
5. NO duplicates.
Return a comprehensive JSON array of up to 30 OFFICIAL products matching this query in India.`;"""

new_sys_inst = """systemInstruction: "You are an extremely strict Agriculture Product Verification System. You only output 100% accurate, official, branded agrochemical product data in JSON array format. Never invent generic products. Never attribute generic NPKs to specific companies. Return [] if unsure.", """

content = re.sub(r'const prompt = `Search for agricultural products associated with brand, company, molecule, target pest, or category.*?30 products\.`;', new_prompt, content, flags=re.DOTALL)

content = re.sub(r'systemInstruction: "You are India\'s Complete Agriculture Product Intelligence Platform.*?company/brand\.",', new_sys_inst, content, flags=re.DOTALL)


# Remove generateSmartFallbackProduct references
content = re.sub(r'if \(cleanQuery && finalProductsList\.length < 5\) \{.*?\}', '', content, flags=re.DOTALL)

content = re.sub(r'const finalBackup = \[\.\.\.backupMatches\];.*?res\.json\(\{ products: finalBackup, source: "backup", isFallback: true \}\);', r'res.json({ products: [], source: "backup", isFallback: true });', content, flags=re.DOTALL)


with open("server.ts", "w") as f:
    f.write(content)
