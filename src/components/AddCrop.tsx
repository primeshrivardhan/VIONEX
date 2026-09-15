import { useState } from "react";
import { Crop } from "../types";
import { ArrowLeft, Save, Mic, MicOff } from "lucide-react";
import DatePicker from "./DatePicker";

interface Props {
  onSave: (crop: Crop) => void;
  onCancel: () => void;
}

export default function AddCrop({ onSave, onCancel }: Props) {
  const [formData, setFormData] = useState({
    name: "",
    plantingDate: "",
    soilType: "काळी (Black)",
    stage: "पेरणी (Sowing)",
    area: "",
    notes: "",
  });
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "mr-IN";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setFormData((prev) => ({
          ...prev,
          notes: prev.notes ? `${prev.notes} ${transcript}` : transcript,
        }));
      };
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } else {
      alert("तुमच्या ब्राउझरमध्ये व्हॉइस टायपिंगची सुविधा नाही.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.area) return;

    const newCrop: Crop = {
      id: crypto.randomUUID(),
      ...formData,
      addedAt: Date.now(),
    };

    onSave(newCrop);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-2xl mx-auto w-full flex flex-col h-full max-h-[80vh]">
      <div className="border-b border-slate-100 p-4 bg-slate-50 flex items-center gap-4 shrink-0">
        <button
          onClick={onCancel}
          type="button"
          className="p-1.5 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-slate-800">नवीन पीक नोंदवा</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <form
          id="add-crop-form"
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              पिकाचे नाव (Crop Name) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="उदा. कापूस, सोयाबीन, कांदा"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-sm bg-slate-50"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                लागवडीची तारीख
              </label>
              <DatePicker
                value={formData.plantingDate}
                onChange={(date) => setFormData({ ...formData, plantingDate: date })}
                className="py-2 bg-slate-50 border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                क्षेत्र (एकर / गुंठे) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="उदा. २ एकर"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-sm bg-slate-50"
                value={formData.area}
                onChange={(e) =>
                  setFormData({ ...formData, area: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                जमिनीचा प्रकार (Soil Type)
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-sm bg-slate-50 text-slate-700"
                value={formData.soilType}
                onChange={(e) =>
                  setFormData({ ...formData, soilType: e.target.value })
                }
              >
                <option value="काळी (Black)">काळी (Black)</option>
                <option value="लाल (Red)">लाल (Red)</option>
                <option value="मुरमाड (Murum/Gravelly)">
                  मुरमाड (Murum/Gravelly)
                </option>
                <option value="वाळूची (Sandy)">वाळूची (Sandy)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                पिकाची अवस्था (Stage)
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-sm bg-slate-50 text-slate-700"
                value={formData.stage}
                onChange={(e) =>
                  setFormData({ ...formData, stage: e.target.value })
                }
              >
                <option value="लागवड/पेरणी (Sowing)">
                  लागवड/पेरणी (Sowing)
                </option>
                <option value="वाढ (Vegetative Growth)">
                  वाढ (Vegetative Growth)
                </option>
                <option value="फुलोरा (Flowering)">फुलोरा (Flowering)</option>
                <option value="फळधारणा (Fruiting)">फळधारणा (Fruiting)</option>
                <option value="काढणी (Harvesting)">काढणी (Harvesting)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">
                इतर माहिती (पर्यायी)
              </label>
              <button
                type="button"
                onClick={startListening}
                disabled={isListening}
                className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors ${
                  isListening
                    ? "bg-red-100 text-red-600 animate-pulse"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                }`}
              >
                {isListening ? (
                  <MicOff className="w-3.5 h-3.5" />
                ) : (
                  <Mic className="w-3.5 h-3.5" />
                )}
                {isListening ? "ऐकत आहे..." : "बोलून माहिती द्या"}
              </button>
            </div>
            <textarea
              rows={3}
              placeholder="पिकाबद्दल कोणतीही अतिरिक्त माहिती..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-sm bg-slate-50 resize-none"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>
        </form>
      </div>

      <div className="p-4 border-t border-slate-100 flex items-center justify-center gap-4 bg-slate-50 shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 text-[10px] bg-slate-100 text-slate-700 px-3 py-1.5 rounded font-bold hover:bg-slate-200 transition border border-slate-200"
        >
          बॅक/रद्द करा
        </button>
        <button
          type="submit"
          form="add-crop-form"
          className="flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded font-bold hover:bg-emerald-200 transition"
        >
          जतन करा
        </button>
      </div>
    </div>
  );
}
