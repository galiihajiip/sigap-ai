import React from 'react';

const AIRecommendations = () => {
    return (
        <div className="xl:col-span-1 flex flex-col h-full bg-[#1e2433] rounded-lg border border-[#2a3441] overflow-hidden shadow-lg">
            {/* Header */}
            <div className="p-5 border-b border-[#2a3441] flex justify-between items-center bg-[#161b26]">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#135bec]">smart_toy</span>
                    Top Recommendations
                </h3>
                <span className="bg-[#135bec]/20 text-[#135bec] text-xs font-bold px-2 py-1 rounded border border-[#135bec]/20">
                    AI ACTIVE
                </span>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col justify-between flex-1 relative overflow-hidden">
                {/* Decorative blur */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#135bec]/5 rounded-full blur-3xl -z-10 pointer-events-none" />

                <div className="space-y-6">
                    {/* Target Location */}
                    <div className="flex items-start gap-4">
                        <div className="bg-[#2a3441] p-3 rounded-lg text-white">
                            <span className="material-symbols-outlined text-[28px]">location_on</span>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Target Location</p>
                            <p className="text-white text-xl font-bold leading-tight">Jl. Soedirman, Surabaya</p>
                            <p className="text-sm text-slate-400 mt-1">Intersection ID: #SUR-4092</p>
                        </div>
                    </div>

                    {/* Critical Alert */}
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-red-500 mt-0.5">warning</span>
                            <div>
                                <p className="text-red-400 font-bold text-sm mb-1">Critical Alert: Southbound Density</p>
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    Vehicles queuing beyond 200m. Predicted +15 min delay if signal timing is not adjusted immediately.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Signal Timing */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-[#2a3441]/50 p-3 rounded border border-[#2a3441]">
                            <p className="text-slate-400 text-xs">Current Green</p>
                            <p className="text-white font-mono font-bold text-lg">45s</p>
                        </div>
                        <div className="bg-[#2a3441]/50 p-3 rounded border border-[#2a3441]">
                            <p className="text-slate-400 text-xs">Recommended</p>
                            <p className="text-[#135bec] font-mono font-bold text-lg">
                                65s <span className="text-xs font-normal text-green-400">(+20s)</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 mt-8">
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-green-600/20 transition-all flex items-center justify-center gap-2 group">
                        <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">auto_fix</span>
                        Apply AI Adjustment
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                        <button className="bg-red-600/90 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg border border-red-700 transition-colors shadow-lg shadow-red-600/10">
                            Reject
                        </button>
                        <button className="bg-blue-600/90 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg border border-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10">
                            <span className="material-symbols-outlined text-[18px]">tune</span>
                            Adjust
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIRecommendations;
