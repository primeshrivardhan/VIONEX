with open("src/App.tsx", "r") as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if "const hasCleanedDatabaseRef = useRef(false);" in line:
        skip = True
        new_lines.append("  // Self-healing database deduplication removed to prevent startup freeze on main thread.\\n")
    if skip and "}, [products]);" in line:
        skip = False
        continue
    if not skip:
        new_lines.append(line)

with open("src/App.tsx", "w") as f:
    f.writelines(new_lines)
