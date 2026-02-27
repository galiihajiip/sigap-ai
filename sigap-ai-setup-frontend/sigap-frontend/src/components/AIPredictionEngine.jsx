import React from 'react';

const AIPredictionEngine = () => {
    // Simulated values — these would come from your API/backend
    const inputVolume = 0;
    const predictedVolume = 0;
    const congestionRisk = 0; // 0-100

    // Dynamic color based on congestion risk
    const getRiskColor = (risk) => {
        if (risk >= 70) return { text: 'text-red-500', bg: 'bg-red-500', glow: 'shadow-red-500/30', gradient: 'from-red-500/20 to-red-500/5' };
        if (risk >= 40) return { text: 'text-yellow-400', bg: 'bg-yellow-400', glow: 'shadow-yellow-400/30', gradient: 'from-yellow-400/20 to-yellow-400/5' };
        return { text: 'text-emerald-400', bg: 'bg-emerald-400', glow: 'shadow-emerald-400/30', gradient: 'from-emerald-400/20 to-emerald-400/5' };
    };

    const riskStyle = getRiskColor(congestionRisk);

    return (
        <div className="bg-[#1e2433] rounded-lg border border-[#2a3441] overflow-hidden shadow-lg relative">
            {/* Subtle animated background glow */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#135bec]/3 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-cyan-500/3 rounded-full blur-[80px] pointer-events-none" />

            {/* Header */}
            <div className="p-5 border-b border-[#2a3441] flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-[#161b26] relative">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#135bec]">psychology</span>
                    AI Prediction Engine
                </h3>
                <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-sm hidden md:inline">LSTM Neural Network — Real-time 15-minute forecast</span>
                    <span className="px-3 py-1 bg-[#135bec]/15 text-[#135bec] text-xs font-bold rounded-full border border-[#135bec]/25 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#135bec] animate-pulse" />
                        MODEL ACTIVE
                    </span>
                </div>
            </div>

            <div className="p-6 relative">
                {/* 3-column grid: Input → Model → Output */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">

                    {/* Input Card — Light Blue Theme */}
                    <div className="bg-gradient-to-br from-cyan-500/10 to-[#161b26] rounded-xl border border-cyan-500/20 p-6 relative overflow-hidden group hover:border-cyan-400/40 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/5 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-400/10 transition-all" />
                        <div className="flex items-center gap-2 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-cyan-400 text-[20px]">input</span>
                            </div>
                            <p className="text-cyan-400 text-xs font-semibold uppercase tracking-wider">Input — Current Volume</p>
                        </div>
                        <p className="text-5xl font-bold text-cyan-300 font-mono mb-2 tracking-tight">{inputVolume}</p>
                        <p className="text-xs text-slate-500">vehicles/cycle <span className="text-cyan-500/50">(simulated sensor)</span></p>
                        {/* Decorative bottom bar */}
                        <div className="mt-4 h-1 w-full rounded-full bg-[#2a3441] overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all duration-500" style={{ width: `${Math.min(inputVolume / 5, 100)}%` }} />
                        </div>
                    </div>

                    {/* LSTM Model Center — Futuristic Neural Network Visual */}
                    <div className="bg-gradient-to-br from-[#135bec]/10 to-[#161b26] rounded-xl border border-[#135bec]/20 p-6 flex flex-col items-center justify-center relative overflow-hidden group hover:border-[#135bec]/40 transition-all duration-300">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgxOSw5MSwyMzYsMC4wNSkiLz48L3N2Zz4=')] opacity-50" />

                        {/* Neural Network SVG Visualization */}
                        <div className="relative mb-4">
                            <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
                                {/* Connection lines */}
                                <line x1="20" y1="20" x2="60" y2="15" stroke="#135bec" strokeWidth="0.8" strokeOpacity="0.3" />
                                <line x1="20" y1="20" x2="60" y2="50" stroke="#135bec" strokeWidth="0.8" strokeOpacity="0.3" />
                                <line x1="20" y1="20" x2="60" y2="85" stroke="#135bec" strokeWidth="0.8" strokeOpacity="0.2" />
                                <line x1="20" y1="50" x2="60" y2="15" stroke="#135bec" strokeWidth="0.8" strokeOpacity="0.2" />
                                <line x1="20" y1="50" x2="60" y2="50" stroke="#135bec" strokeWidth="0.8" strokeOpacity="0.4" />
                                <line x1="20" y1="50" x2="60" y2="85" stroke="#135bec" strokeWidth="0.8" strokeOpacity="0.3" />
                                <line x1="20" y1="80" x2="60" y2="15" stroke="#135bec" strokeWidth="0.8" strokeOpacity="0.2" />
                                <line x1="20" y1="80" x2="60" y2="50" stroke="#135bec" strokeWidth="0.8" strokeOpacity="0.3" />
                                <line x1="20" y1="80" x2="60" y2="85" stroke="#135bec" strokeWidth="0.8" strokeOpacity="0.4" />
                                <line x1="60" y1="15" x2="100" y2="50" stroke="#135bec" strokeWidth="0.8" strokeOpacity="0.3" />
                                <line x1="60" y1="50" x2="100" y2="50" stroke="#135bec" strokeWidth="0.8" strokeOpacity="0.5" />
                                <line x1="60" y1="85" x2="100" y2="50" stroke="#135bec" strokeWidth="0.8" strokeOpacity="0.3" />
                                {/* Input nodes */}
                                <circle cx="20" cy="20" r="5" fill="#135bec" fillOpacity="0.3" stroke="#135bec" strokeWidth="1" />
                                <circle cx="20" cy="50" r="5" fill="#135bec" fillOpacity="0.5" stroke="#135bec" strokeWidth="1" />
                                <circle cx="20" cy="80" r="5" fill="#135bec" fillOpacity="0.3" stroke="#135bec" strokeWidth="1" />
                                {/* Hidden layer */}
                                <circle cx="60" cy="15" r="6" fill="#135bec" fillOpacity="0.2" stroke="#135bec" strokeWidth="1.2">
                                    <animate attributeName="fillOpacity" values="0.2;0.5;0.2" dur="2s" repeatCount="indefinite" />
                                </circle>
                                <circle cx="60" cy="50" r="7" fill="#135bec" fillOpacity="0.4" stroke="#135bec" strokeWidth="1.5">
                                    <animate attributeName="fillOpacity" values="0.4;0.7;0.4" dur="1.5s" repeatCount="indefinite" />
                                </circle>
                                <circle cx="60" cy="85" r="6" fill="#135bec" fillOpacity="0.2" stroke="#135bec" strokeWidth="1.2">
                                    <animate attributeName="fillOpacity" values="0.2;0.6;0.2" dur="2.5s" repeatCount="indefinite" />
                                </circle>
                                {/* Output node */}
                                <circle cx="100" cy="50" r="8" fill="#135bec" fillOpacity="0.3" stroke="#135bec" strokeWidth="1.5">
                                    <animate attributeName="r" values="7;9;7" dur="2s" repeatCount="indefinite" />
                                </circle>
                            </svg>
                            {/* Glow behind neural network */}
                            <div className="absolute inset-0 bg-[#135bec]/10 blur-xl rounded-full pointer-events-none" />
                        </div>

                        <p className="text-white font-bold text-sm mb-0.5">LSTM Model</p>
                        <p className="text-[#135bec]/60 text-xs font-mono">sigap_model.h5</p>


                    </div>

                    {/* Output Card — Dynamic Color */}
                    <div className={`bg-gradient-to-br ${riskStyle.gradient} to-[#161b26] rounded-xl border border-[#2a3441] p-6 relative overflow-hidden group hover:border-slate-600/40 transition-all duration-300`}>
                        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none ${congestionRisk >= 70 ? 'bg-red-500/5 group-hover:bg-red-500/10' : congestionRisk >= 40 ? 'bg-yellow-400/5 group-hover:bg-yellow-400/10' : 'bg-emerald-400/5 group-hover:bg-emerald-400/10'} transition-all`} />
                        <div className="flex items-center gap-2 mb-5">
                            <div className={`w-8 h-8 rounded-lg ${congestionRisk >= 70 ? 'bg-red-500/20' : congestionRisk >= 40 ? 'bg-yellow-400/20' : 'bg-emerald-400/20'} flex items-center justify-center`}>
                                <span className={`material-symbols-outlined ${riskStyle.text} text-[20px]`}>output</span>
                            </div>
                            <p className={`${riskStyle.text} text-xs font-semibold uppercase tracking-wider`}>Output — Predicted Volume</p>
                        </div>
                        <p className={`text-5xl font-bold ${riskStyle.text} font-mono mb-2 tracking-tight`}>{predictedVolume}</p>
                        <p className="text-xs text-slate-500">predicted in 15 minutes</p>
                        {/* Decorative bottom bar */}
                        <div className="mt-4 h-1 w-full rounded-full bg-[#2a3441] overflow-hidden">
                            <div className={`h-full rounded-full ${riskStyle.bg} transition-all duration-500`} style={{ width: `${Math.min(predictedVolume / 5, 100)}%` }} />
                        </div>
                    </div>
                </div>

                {/* Congestion Risk Gauge */}
                <div className={`mt-5 bg-gradient-to-r ${riskStyle.gradient} rounded-xl border border-[#2a3441] p-5 relative overflow-hidden`}>
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                            <span className={`material-symbols-outlined ${riskStyle.text} text-[20px]`}>speed</span>
                            <p className="text-slate-300 text-sm font-medium">Congestion Risk Level</p>
                        </div>
                        <p className={`${riskStyle.text} font-bold text-2xl font-mono`}>{congestionRisk}%</p>
                    </div>
                    <div className="w-full bg-[#2a3441] h-3 rounded-full overflow-hidden">
                        <div
                            className={`${riskStyle.bg} h-full rounded-full transition-all duration-700 shadow-lg ${riskStyle.glow}`}
                            style={{ width: `${congestionRisk}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600 mt-1.5 px-0.5">
                        <span>0%</span>
                        <span>25%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIPredictionEngine;
