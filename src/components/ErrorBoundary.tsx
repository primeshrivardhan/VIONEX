import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-2">अरेरे! काहीतरी गडबड झाली.</h1>
          <p className="text-slate-500 mb-6">ॲपमध्ये तांत्रिक अडचण आली आहे. कृपया पृष्ठ रिफ्रेश करा.</p>
          <div className="bg-white p-4 rounded-xl border border-slate-200 text-left w-full max-w-md overflow-auto mb-6 shadow-sm">
            <p className="text-xs font-mono text-red-500 break-all">{this.state.error?.message}</p>
            {this.state.error?.stack && (
               <details className="mt-2 text-left">
                 <summary className="text-[10px] text-slate-400 cursor-pointer hover:text-slate-600 transition-colors">तांत्रिक माहिती (Technical Stack)</summary>
                 <pre className="text-[10px] text-slate-300 mt-2 p-2 bg-slate-900 rounded-lg overflow-auto max-h-40">{this.state.error.stack}</pre>
               </details>
            )}
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
            >
              पुन्हा प्रयत्न करा (Try Again)
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem("vionex-current-user");
                window.location.href = window.location.origin;
              }}
              className="px-4 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold active:scale-95 transition-all text-xs"
            >
              लॉगआउट करा (Logout)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
