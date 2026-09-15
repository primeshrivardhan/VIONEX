import re

with open("server.ts", "r") as f:
    content = f.read()

# Remove generateSmartFallbackProduct calls
content = re.sub(r'const fall = generateSmartFallbackProduct\(cleanQuery\);.*?\}', '', content, flags=re.DOTALL)
# The regex above might be dangerous, let's do it via targeted replacements

