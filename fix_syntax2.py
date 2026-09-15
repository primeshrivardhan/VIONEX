with open("server.ts", "r") as f:
    text = f.read()

text = text.replace("""      const finalProductsList = Array.from(mergedProductsMap.values());
            }
      monitoringStats.successfulAiRequests++;""", """      const finalProductsList = Array.from(mergedProductsMap.values());
      
      monitoringStats.successfulAiRequests++;""")

with open("server.ts", "w") as f:
    f.write(text)
