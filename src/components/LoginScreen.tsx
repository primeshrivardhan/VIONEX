import React, { useState, useEffect } from 'react';
import { Sprout, Phone, Download, LogIn, User } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, setExplicitAuthInProgress } from '../lib/firebase';

interface LoginScreenProps {
  onUserLogin: (userId: string, pass: string) => Promise<"success" | "pending" | "created" | "wrong_password"> | "success" | "pending" | "created" | "wrong_password";
  onFarmerLogin: (mobile: string, pass: string) => Promise<"success" | "pending" | "created" | "wrong_password" | "denied"> | "success" | "pending" | "created" | "wrong_password" | "denied";
  defaultType?: "user" | "farmer" | null;
  defaultMobile?: string;
}

export default function LoginScreen({ onUserLogin, onFarmerLogin, defaultType = null, defaultMobile = '' }: LoginScreenProps) {
  const [loginType, setLoginType] = useState<"user" | "farmer" | null>(defaultType);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [farmerPassword, setFarmerPassword] = useState('');
  const [mobile, setMobile] = useState(defaultMobile);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);



  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      if (loginType === 'user') {
        const status = await onUserLogin(userId, password);
        if (status === 'wrong_password') setError('चुकीचा युजर आयडी किंवा पासवर्ड (Wrong password).');
        else if (status === 'pending') setError('तुमची रिक्वेस्ट ऍडमिनकडे पाठवली आहे. कृपया अप्रूव्ह होण्याची वाट पहा (Pending Admin Approval).');
        else if (status === 'created') setError('तुमचे नवीन खाते तयार करून ऍडमिनकडे रिक्वेस्ट पाठवली आहे. (Approval Request Sent).');
      } else if (loginType === 'farmer') {
        if (mobile.length < 10) {
          setError('कृपया १० अंकी मोबाईल नंबर टाका.');
          setIsSubmitting(false);
          return;
        }
        const status = await onFarmerLogin(mobile, farmerPassword);
        if (status === 'wrong_password') setError('चुकीचा मोबाईल नंबर किंवा पासवर्ड (Wrong password). कृपया पुन्हा तपासा.');
        else if (status === 'pending') setError('तुमची रिक्वेस्ट ऍडमिनकडे पाठवली आहे. कृपया अप्रूव्ह होण्याची वाट पहा (Pending Admin Approval).');
        else if (status === 'created') setError('तुमचे नवीन खाते तयार करून ऍडमिनकडे रिक्वेस्ट पाठवली आहे. (Approval Request Sent).');
        else if (status === 'denied') setError('तुमचा मोबाईल नंबर नोंदणीकृत नाही किंवा प्रवेश नाकारला आहे. कृपया ॲडमिनशी संपर्क साधा (Mobile not registered or access denied).');
      }
    } catch (err) {
      console.error(err);
      setError('लॉगिन करताना काहीतरी त्रुटी आली. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobile(val);
    setError('');
  };

  const handleGoogleLogin = async () => {
    if (!auth) {
      alert("Google लॉगिन सेवा सध्या उपलब्ध नाही (Firebase Auth API key is not configured yet).");
      return;
    }
    setExplicitAuthInProgress(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      alert("Google सह सिंक यशस्वी! आता तुमचे डेटा सर्व डिव्हाइसवर उपलब्ध असेल.");
    } catch (err) {
      console.error("Google Login Error:", err);
      setError("Google लॉगिन मध्ये अडचण आली.");
    } finally {
      setExplicitAuthInProgress(false);
    }
  };

  if (!loginType) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
          <div className="bg-emerald-800 p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-700/30 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-900/40 rounded-full -ml-12 -mb-12 blur-xl"></div>
            
            <div className="relative z-10">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-emerald-800 mx-auto mb-6 font-black text-3xl shadow-2xl border-4 border-emerald-700/20 rotate-3">
                vx
              </div>
              <h1 className="text-3xl font-black tracking-tighter text-white flex items-center justify-center gap-2 mb-2 italic">
                <span className="font-mono lowercase tracking-widest bg-white/10 px-3 py-1 rounded-xl backdrop-blur-sm border border-white/10">vionex</span>
              </h1>
              <p className="text-emerald-100/70 text-[10px] font-black uppercase tracking-[0.3em] ml-1">Crop Care Solution</p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-black text-slate-800 mb-1">लॉगिन प्रकार निवडा</h2>
              <p className="text-xs text-slate-500 font-medium tracking-tight">तुमचा प्रोफाइल प्रकार निवडून पुढे जा</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => setLoginType('farmer')}
                className="group relative flex items-center gap-4 p-6 bg-emerald-50 rounded-2xl border-2 border-emerald-100 hover:border-emerald-500 hover:bg-emerald-100 transition-all text-left overflow-hidden shadow-sm hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100 group-hover:scale-110 transition-transform">
                  <Sprout className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">शेतकरी लॉगिन</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Farmer Access</p>
                </div>
                <div className="absolute right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <LogIn className="w-5 h-5 text-emerald-600" />
                </div>
              </button>

              <button 
                onClick={() => setLoginType('user')}
                className="group relative flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 hover:border-slate-400 hover:bg-white transition-all text-left overflow-hidden shadow-sm hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-slate-600 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">युजर लॉगिन</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Staff / Admin Access</p>
                </div>
                <div className="absolute right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <LogIn className="w-5 h-5 text-slate-400" />
                </div>
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-emerald-800 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-700/20 rounded-full -mr-12 -mt-12 blur-xl"></div>
          <button 
            onClick={() => setLoginType(null)}
            className="absolute top-4 left-4 p-2 rounded-xl bg-white/10 backdrop-blur-md hover:bg-white/20 text-emerald-100 transition-all z-20 border border-white/10"
          >
            ← मागे
          </button>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-800 mx-auto mb-4 font-black text-2xl shadow-xl rotate-3">
              vx
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mb-1 uppercase italic">
              {loginType === 'farmer' ? 'शेतकरी लॉगिन' : 'युजर लॉगिन'}
            </h1>
            <p className="text-emerald-200/60 text-[10px] tracking-[0.2em] uppercase font-black">vionex smart farming</p>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100 text-center">
                {error}
              </div>
            )}

            {loginType === 'user' ? (
              <>
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1.5 ml-1">युजर आयडी</label>
                  <input
                    type="text"
                    required
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-800 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300 shadow-inner"
                    placeholder="युजर आयडी टाका"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1.5 ml-1">पासवर्ड</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-800 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300 shadow-inner"
                    placeholder="पासवर्ड टाका"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1.5 ml-1">मोबाईल नंबर</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300">
                      <Phone className="w-5 h-5" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={mobile}
                      onChange={handleMobileChange}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-800 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-inner"
                      placeholder="१० अंकी नंबर"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1.5 ml-1">पासवर्ड</label>
                  <input
                    type="password"
                    required
                    value={farmerPassword}
                    onChange={(e) => setFarmerPassword(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-800 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300 shadow-inner"
                    placeholder="पासवर्ड टाका"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/20 hover:bg-emerald-500 transition-all active:scale-[0.98] mt-4 uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  लॉगिन होत आहे...
                </>
              ) : (
                "लॉगिन करा"
              )}
            </button>
          </form>

          {loginType !== 'user' && (
            <>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                  <span className="bg-white px-3 text-slate-300">किंवा</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3.5 bg-white text-slate-600 font-bold rounded-2xl shadow-sm border border-slate-100 flex justify-center items-center gap-3 hover:bg-slate-50 transition-all text-xs uppercase"
              >
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                डेटा सिंक करा (Google Sync)
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
