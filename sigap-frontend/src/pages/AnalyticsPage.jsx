import React, { useState } from 'react';

const heatmapData = [
    { day: 'Mon', cells: ['low', 'low', 'low', 'med', 'high', 'med', 'low', 'low'] },
    { day: 'Tue', cells: ['low', 'low', 'med', 'med', 'high', 'med', 'low', 'low'] },
    { day: 'Wed', cells: ['low', 'low', 'med', 'med', 'mid', 'med', 'low', 'low'] },
    { day: 'Thu', cells: ['low', 'low', 'med', 'med', 'med', 'low', 'high', 'med'] },
    { day: 'Fri', cells: ['low', 'low', 'med', 'med', 'med', 'med', 'low', 'low'] },
    { day: 'Sat', cells: ['low', 'low', 'low', 'low', 'med', 'low', 'med', 'low'] },
    { day: 'Sun', cells: ['low', 'low', 'low', 'low', 'med', 'low', 'low', 'med'] },
];

// Wed 8AM special: "88%" bg-[#3b82f6]
const heatmapSpecial = {
    'Wed-4': { label: '88%', bg: 'bg-[#3b82f6]' },
    'Mon-4': { label: '92%', bg: 'bg-[#135bec]', shadow: true },
    'Tue-4': { label: '95%', bg: 'bg-[#135bec]', shadow: true },
    'Thu-6': { label: '99%', bg: 'bg-[#135bec]', shadow: true },
};

const cellBg = (level) => {
    if (level === 'high') return 'bg-[#135bec]';
    if (level === 'med') return 'bg-[#2563eb]';
    if (level === 'mid') return 'bg-[#3b82f6]';
    return 'bg-[#1e293b]';
};

const timeLabels = ['12AM', '2AM', '4AM', '6AM', '8AM', '10AM', '12PM', '2PM'];

const causes = [
    { label: 'Accidents', pct: 75 },
    { label: 'Weather', pct: 45 },
    { label: 'Construction', pct: 30 },
    { label: 'Signal fail', pct: 15 },
];

const decisionLog = [
    { ts: '19/2-2026, 16:00', loc: 'Jl. Ahmad Yani', event: 'Traffic Congestion', ai: 'Rec 30s wait time', human: 'No Action taken', outcome: 'Smooth Traffic', detail: 'Traffic volume decreased' },
    { ts: '19/2-2026, 16:00', loc: 'Jl. Bronggalan', event: 'Traffic Congestion', ai: 'Rec 40s wait time', human: 'No Action taken', outcome: 'Smooth Traffic', detail: 'Traffic volume decreased' },
    { ts: '19/2-2026, 16:00', loc: 'Jl. Rungkut', event: 'Traffic Congestion', ai: 'Rec 20s wait time', human: 'No Action taken', outcome: 'Smooth Traffic', detail: 'Traffic volume decreased' },
    { ts: '19/2-2026, 16:00', loc: 'Jl. Wiyung', event: 'Traffic Congestion', ai: 'Rec 50s wait time', human: 'No Action taken', outcome: 'Smooth Traffic', detail: 'Traffic volume decreased' },
    { ts: '19/2-2026, 16:00', loc: 'Jl. Jombang', event: 'Traffic Congestion', ai: 'Rec 120s wait time', human: 'No Action taken', outcome: 'Smooth Traffic', detail: 'Traffic volume decreased' },
    { ts: '19/2-2026, 16:00', loc: 'Jl. pasar turi', event: 'Traffic Congestion', ai: 'Rec 80s wait time', human: 'No Action taken', outcome: 'Smooth Traffic', detail: 'Traffic volume decreased' },
];

const AnalyticsPage = () => {
    const [activePeriod, setActivePeriod] = useState('7 days');
    const [search, setSearch] = useState('');

    const filtered = decisionLog.filter(row =>
        Object.values(row).some(v => v.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="flex-1 p-6 lg:p-10 max-w-[1600px] mx-auto w-full space-y-8">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <h1 className="text-4xl font-bold text-white">History &amp; Pattern Analysis</h1>
                <div className="bg-[#1e2433] rounded-lg p-1 flex border border-[#2a3441]">
                    {['7 days', '30 days', '60 days'].map(p => (
                        <button
                            key={p}
                            onClick={() => setActivePeriod(p)}
                            className={`px-6 py-2 rounded text-sm font-medium transition-colors ${activePeriod === p
                                    ? 'bg-[#135bec] text-white font-bold shadow-lg shadow-[#135bec]/20'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* Weekly Congestion Heatmap */}
            <section className="bg-[#161b26] rounded-xl border border-[#2a3441] p-6 lg:p-8">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-white mb-1">Weekly Congestion Heatmap</h2>
                    <p className="text-slate-400 text-sm">Intensity by Time of the Day vs Day of week</p>
                </div>
                <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                        {/* Time header */}
                        <div className="grid grid-cols-[80px_repeat(8,1fr)] gap-2 mb-2 text-center">
                            <div />
                            {timeLabels.map(t => (
                                <div key={t} className="text-xs font-semibold text-slate-300">{t}</div>
                            ))}
                        </div>
                        {/* Rows */}
                        {heatmapData.map(({ day, cells }) => (
                            <div key={day} className="grid grid-cols-[80px_repeat(8,1fr)] gap-2 mb-2 items-center">
                                <div className="text-sm font-medium text-slate-300 pl-2">{day}</div>
                                {cells.map((level, i) => {
                                    const key = `${day}-${i}`;
                                    const special = heatmapSpecial[key];
                                    return (
                                        <div
                                            key={i}
                                            className={`h-10 rounded heatmap-cell transition-transform duration-200 hover:scale-105 hover:z-10 flex items-center justify-center
                        ${special ? special.bg : cellBg(level)}
                        ${special?.shadow ? 'shadow-lg shadow-[#135bec]/20' : ''}`}
                                        >
                                            {special?.label && (
                                                <span className="text-white text-xs font-bold">{special.label}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Acceptance Rate + Top Causes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Rec. Acceptance Rate */}
                <div className="bg-[#161b26] rounded-xl border border-[#2a3441] p-8 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-lg font-bold text-white">Rec. Acceptance Rate</h3>
                        <span className="material-symbols-outlined text-slate-500 text-[64px] opacity-20 absolute top-6 right-8">thumb_up</span>
                    </div>
                    <div className="flex items-end gap-3 mb-8 relative z-10">
                        <span className="text-6xl font-bold text-green-500">85%</span>
                        <div className="flex items-center text-green-500 mb-2 gap-1 bg-green-500/10 px-2 py-1 rounded">
                            <span className="material-symbols-outlined text-[20px]">trending_up</span>
                            <span className="text-sm font-bold">12%</span>
                        </div>
                    </div>
                    <div className="w-full h-4 bg-[#1e293b] rounded-full overflow-hidden flex mb-4">
                        <div className="h-full bg-blue-600" style={{ width: '85%' }} />
                        <div className="h-full bg-slate-400" style={{ width: '5%' }} />
                        <div className="h-full bg-red-600" style={{ width: '10%' }} />
                    </div>
                    <div className="flex gap-6 text-xs font-medium">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                            <span className="text-slate-400">Approved (85%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-600" />
                            <span className="text-slate-400">Rejected (10%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            <span className="text-slate-400">Modified (5%)</span>
                        </div>
                    </div>
                </div>

                {/* Top Recurring Causes */}
                <div className="bg-[#161b26] rounded-xl border border-[#2a3441] p-8 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white">Top Recurring Causes</h3>
                            <p className="text-slate-400 text-xs mt-1">Primary triggers for congestion alerts</p>
                        </div>
                        <span className="material-symbols-outlined text-slate-500 text-[64px] opacity-20 absolute top-6 right-8">warning</span>
                    </div>
                    <div className="space-y-5 relative z-10">
                        {causes.map(({ label, pct }) => (
                            <div key={label} className="grid grid-cols-[100px_1fr_40px] items-center gap-4">
                                <span className="text-sm font-medium text-white">{label}</span>
                                <div className="h-2 w-full bg-[#1e293b] rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-sm font-bold text-slate-300 text-right">{pct}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Decision Log Table */}
            <section className="bg-[#161b26] rounded-xl border border-[#2a3441] overflow-hidden">
                <div className="p-6 border-b border-[#2a3441] flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">Decision Log</h2>
                        <p className="text-slate-400 text-sm">Historical record of AI predictions vs Human actions.</p>
                    </div>
                    <div className="relative w-full md:w-80">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400">search</span>
                        <input
                            className="w-full bg-[#0B1120] border border-[#2a3441] text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#135bec] focus:ring-1 focus:ring-[#135bec] transition-colors"
                            placeholder="Search..."
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#135bec] text-white text-sm">
                                {['Time Stamp', 'Location', 'Event Type', 'AI Prediction', 'Human Action', 'Outcome', 'Details'].map(h => (
                                    <th key={h} className="py-4 px-6 font-semibold whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-[#2a3441]">
                            {filtered.map((row, i) => (
                                <tr key={i} className="hover:bg-[#1e2433] transition-colors">
                                    <td className="py-4 px-6 text-white font-medium whitespace-nowrap">{row.ts}</td>
                                    <td className="py-4 px-6 text-slate-300">{row.loc}</td>
                                    <td className="py-4 px-6 text-slate-300">{row.event}</td>
                                    <td className="py-4 px-6 text-slate-300">{row.ai}</td>
                                    <td className="py-4 px-6 text-slate-300">{row.human}</td>
                                    <td className="py-4 px-6 text-white font-medium">{row.outcome}</td>
                                    <td className="py-4 px-6 text-slate-400">{row.detail}</td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500">No results found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default AnalyticsPage;
