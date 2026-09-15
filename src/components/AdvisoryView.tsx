import { useState, useEffect, useMemo } from "react";
import { Crop, Alert as AlertType } from "../types";
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  Send,
  Globe,
  WifiOff,
  Cloud,
  AlertTriangle,
  CloudRain,
  Wind,
} from "lucide-react";
import Markdown from "react-markdown";
import { getApiUrl, getAuthHeaders } from "../lib/config";

interface Props {
  crop: Crop;
  onBack: () => void;
  alerts: AlertType[];
}

export default function AdvisoryView({ crop, onBack, alerts }: Props) {
  const [issue, setIssue] = useState("");
  const [advice, setAdvice] = useState<string | null>(() => {
    return localStorage.getItem(`krushi-mitra-advice-${crop.id}`);
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  const weatherAlerts = useMemo(() => [
    { text: "पुढील ४८ तासांत पावसाची १०% शक्यता. फवारणी नियोजनात खबरदारी घ्या.", type: "weather", icon: <CloudRain className="w-3 h-3" /> },
    { text: "जास्त आर्द्रतेमुळे करपा आणि भुरी रोगाचा प्रादुर्भाव वाढण्याची शक्यता.", type: "disease", icon: <AlertTriangle className="w-3 h-3" /> },
    { text: "उद्या हवेचा वेग जास्त राहण्याची शक्यता असल्याने उंच पिकांना आधार द्या.", type: "wind", icon: <Wind className="w-3 h-3" /> },
    { text: "तापमानात वाढ होत असल्याने पाण्याचे नियोजन वेळेवर करा.", type: "temp", icon: <AlertTriangle className="w-3 h-3" /> }
  ], []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const fetchAdvice = async (customIssue?: string) => {
    if (!navigator.onLine) {
      if (advice) {
        setError(
          "तुम्ही सध्या ऑफलाईन आहात. आधी जतन केलेला सल्ला दाखवला जात आहे.",
        );
      } else {
        setError(
          "तुम्ही सध्या ऑफलाईन आहात. माहिती मिळवण्यासाठी इंटरनेट कनेक्टिव्हिटीची आवश्यकता आहे.",
        );
      }
      return;
    }

    const apiUrl = getApiUrl("/api/advice");
    if (!apiUrl) {
      if (!advice) {
        setError("कृषी सल्लागार ऑनलाइन सेवा सध्या उपलब्ध नाही (Backend advisory service not configured yet).");
      }
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          cropName: crop.name,
          soilType: crop.soilType,
          stage: crop.stage,
          area: crop.area,
          issue: customIssue || "अतिरिक्त माहिती नाही",
        }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "सल्ला मिळवण्यात अडचण आली.");

      setAdvice(data.advice);
      localStorage.setItem(`krushi-mitra-advice-${crop.id}`, data.advice);
      if (!customIssue) setIssue("");
    } catch (err: any) {
      if (advice) {
        setError(
          "नवीन माहिती मिळवताना अडचण आली. जुना सल्ला दाखवला जात आहे: " +
            err.message,
        );
      } else {
        setError(err.message || "सल्ला मिळवण्यात अडचण आली.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch advice on mount only if there's no cached advice or if we are online
    if (!advice || isOnline) {
      fetchAdvice();
    }
  }, [crop.id]);

  const handleSubmitIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue.trim()) return;
    if (!isOnline) {
      alert(
        "प्रश्न विचारण्यासाठी इंटरनेटची आवश्यकता आहे. तुम्ही सध्या ऑफलाईन आहात.",
      );
      return;
    }
    fetchAdvice(issue);
  };

  return (
    <div className="bg-slate-900 text-white rounded-xl shadow-lg flex flex-col h-full w-full mx-auto max-w-4xl max-h-[80vh] overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-slate-800 border border-transparent rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse hidden sm:block"></div>
              स्मार्ट एआय सल्ला: {crop.name}
            </h2>
            <p className="text-xs text-slate-400 font-medium sm:ml-4">
              {crop.stage} | क्षेत्र: {crop.area}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {isOnline ? (
            <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded">
              <Cloud className="w-3.5 h-3.5" />
              ऑनलाईन
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2 py-1 rounded">
              <WifiOff className="w-3.5 h-3.5" />
              ऑफलाईन (कॅश सक्षम)
            </span>
          )}
        </div>
      </div>

      <div className="flex-grow p-4 sm:p-6 overflow-y-auto w-full">
        {loading && !advice && (
          <div className="flex flex-col items-center justify-center p-12 text-emerald-400 h-full">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="font-bold text-sm tracking-widest uppercase animate-pulse">
              तज्ञांकडून माहिती मिळवत आहोत...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-amber-500/10 text-amber-400 p-4 rounded-lg border-l-4 border-amber-500 mb-6 flex flex-col items-start gap-2">
            <p className="text-sm font-medium">{error}</p>
            {isOnline && (
              <button
                onClick={() => fetchAdvice(issue)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition"
              >
                पुन्हा प्रयत्न करा
              </button>
            )}
          </div>
        )}

        {advice && (
          <div className="bg-slate-800 p-5 sm:p-6 rounded-lg border-l-4 border-emerald-500 w-full max-w-none">
            {alerts.length > 0 && (
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <h3 className="text-amber-400 font-bold mb-2 text-xs uppercase tracking-widest flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> सतर्कता:
                </h3>
                {alerts.map(alert => (
                  <p key={alert.id} className="text-xs text-slate-300 mb-1">{alert.text}</p>
                ))}
              </div>
            )}
            <div className="prose prose-invert prose-emerald text-sm leading-relaxed text-slate-300 max-w-none w-full markdown-body">
              <Markdown>{advice}</Markdown>
            </div>
            {!isOnline && (
              <div className="mt-4 p-3 bg-slate-750 rounded-lg text-xs text-slate-400 border border-slate-700/50 flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-amber-500" />
                <span>
                  हा सल्ला ऑफलाईन मोडमध्ये सुरक्षितपणे संचयित (Cashed) केला गेला
                  होता.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-slate-800 p-4 shrink-0 bg-slate-900">
        <form onSubmit={handleSubmitIssue} className="flex gap-2">
          <input
            type="text"
            placeholder={
              isOnline
                ? "पिकाबद्दल एखादी समस्या किंवा प्रश्न विचारा..."
                : "प्रश्न विचारण्यासाठी ऑनलाईन असणे आवश्यक आहे"
            }
            className="flex-grow px-4 py-3 rounded-lg border border-slate-700 focus:border-emerald-500 outline-none transition bg-slate-800 text-sm text-white placeholder-slate-500 disabled:opacity-50"
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            disabled={loading || !isOnline}
          />
          <button
            type="submit"
            disabled={loading || !issue.trim() || !isOnline}
            className="w-12 h-[46px] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg flex items-center justify-center transition-all shrink-0"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
