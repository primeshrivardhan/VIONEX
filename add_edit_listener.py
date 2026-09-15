import sys

with open('src/components/DealersView.tsx') as f:
    content = f.read()

listener_code = """
  useEffect(() => {
    const handleEditEvent = (e: any) => {
      if (e.detail) {
        handleOpenEditForm(e.detail);
      }
    };
    window.addEventListener('edit-dealer', handleEditEvent);
    return () => window.removeEventListener('edit-dealer', handleEditEvent);
  }, []);
"""

content = content.replace('  const [isManualVillage, setIsManualVillage] = useState(false);', '  const [isManualVillage, setIsManualVillage] = useState(false);\n' + listener_code)

with open('src/components/DealersView.tsx', 'w') as f:
    f.write(content)
