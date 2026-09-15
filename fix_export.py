import sys

with open('src/components/LocationMapping.tsx') as f:
    content = f.read()

old_export_map = """      return row.villageDealers.map((d: any, dIdx: number) => ({
        "Sr No": dIdx === 0 ? (idx + 1).toString() : "",
        "Taluka": dIdx === 0 ? row.taluka : "",
        "Village": dIdx === 0 ? row.village : "",
        "Marathi Name": dIdx === 0 ? (row.villageMarathi || "-") : "",
        "District": dIdx === 0 ? row.district : "",
        "State": dIdx === 0 ? row.state : "","""

new_export_map = """      return row.villageDealers.map((d: any, dIdx: number) => ({
        "Sr No": dIdx === 0 ? (idx + 1).toString() : "",
        "Taluka": row.taluka,
        "Village": row.village,
        "Marathi Name": row.villageMarathi || "-",
        "District": row.district,
        "State": row.state,"""

if old_export_map in content:
    content = content.replace(old_export_map, new_export_map)
    with open('src/components/LocationMapping.tsx', 'w') as f:
        f.write(content)
    print("Fixed CSV Export")
else:
    print("Could not find old_export_map")

