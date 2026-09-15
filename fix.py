with open("server.ts", "r") as f:
    text = f.read()

text = text.replace("""mergedProductsMap.values());
      
      }
      monitoringStats.successfulAiRequests++;""", """mergedProductsMap.values());
      
      monitoringStats.successfulAiRequests++;""")

with open("server.ts", "w") as f:
    f.write(text)
