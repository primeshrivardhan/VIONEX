with open("server.ts", "r") as f:
    text = f.read()

idx = text.find("monitoringStats.successfulAiRequests++;")
print(repr(text[idx-50:idx+50]))
