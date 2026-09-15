import { useState } from "react";
import { FileText, Save, Download } from "lucide-react";

export default function MasterScheduleView() {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");

  const handleSave = () => {
    console.log("Saving schedule:", { title, content });
    alert("मास्टर शेड्युल सेव्ह झाले!");
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${title || "master-schedule"}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto w-full">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <FileText className="w-6 h-6 text-purple-500" />
          मास्टर शेड्युल तयार करा
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">शेड्युलचे नाव</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-purple-500 outline-none"
              placeholder="उदा. रब्बी हंगाम मास्टर प्लॅन"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">शेड्युल तपशील</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-64 p-3 rounded-xl border border-slate-200 focus:border-purple-500 outline-none"
              placeholder="येथे तुमचे तपशील लिहा..."
            />
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors"
            >
              <Save className="w-5 h-5" />
              सेव्ह करा
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 py-3 bg-slate-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              डाउनलोड करा
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
