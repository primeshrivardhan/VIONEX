import sys

with open('src/components/LocationMapping.tsx') as f:
    content = f.read()

content = content.replace(
    '  dealers: Dealer[];\n}',
    '  dealers: Dealer[];\n  onDeleteDealer?: (id: string) => Promise<any>;\n  onNavigateToDealers?: () => void;\n}'
)
content = content.replace(
    'export default function LocationMapping({ onBack, language = "mr", dealers }: LocationMappingProps) {',
    'export default function LocationMapping({ onBack, language = "mr", dealers, onDeleteDealer, onNavigateToDealers }: LocationMappingProps) {'
)

with open('src/components/LocationMapping.tsx', 'w') as f:
    f.write(content)
