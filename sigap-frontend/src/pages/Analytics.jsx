import React, { useState, useMemo } from 'react';

// ─── Data sets per time range ───────────────────────────────────────────────

const dataByRange = {
    '7 days': {
        heatmap: [
            { day: 'Mon', cells: [0, 0, 0, 1, 2, 1, 0, 0], labels: [null, null, null, null, '92%', null, null, null] },
            { day: 'Tue', cells: [0, 0, 1, 1, 2, 1, 0, 0], labels: [null, null, null, null, '95%', null, null, null] },
            { day: 'Wed', cells: [0, 0, 1, 1, 1, 1, 0, 0], labels: [null, null, null, null, '88%', null, null, null] },
            { day: 'Thu', cells: [0, 0, 1, 1, 1, 0, 2, 1], labels: [null, null, null, null, null, null, '99%', null] },
            { day: 'Fri', cells: [0, 0, 1, 1, 1, 1, 0, 0], labels: [null, null, null, null, null, null, null, null] },
            { day: 'Sat', cells: [0, 0, 0, 0, 1, 0, 1, 0], labels: [null, null, null, null, null, null, null, null] },
            { day: 'Sun', cells: [0, 0, 0, 0, 1, 0, 0, 1], labels: [null, null, null, null, null, null, null, null] },
        ],
        acceptanceRate: 85,
        acceptanceTrend: 12,
        approved: 85,
        rejected: 10,
        modified: 5,
        recurringCauses: [
            { name: 'Accidents', percentage: 75 },
            { name: 'Weather', percentage: 45 },
            { name: 'Construction', percentage: 30 },
            { name: 'Signal fail', percentage: 15 },
        ],
        logs: [
            { timestamp: '22/2-2026, 14:30', location: 'Jl. Ahmad Yani', eventType: 'Traffic Congestion', aiPrediction: 'Rec 30s green ext.', humanAction: 'Applied', outcome: 'Congestion -18%', details: 'Density dropped from 92% to 74%' },
            { timestamp: '22/2-2026, 14:15', location: 'Jl. Diponegoro', eventType: 'Slow Traffic', aiPrediction: 'Rec reroute via Jl. Darmo', humanAction: 'Applied', outcome: 'Speed +12 km/h', details: 'Average speed increased to 27 km/h' },
            { timestamp: '22/2-2026, 13:45', location: 'Jl. Rungkut', eventType: 'Traffic Congestion', aiPrediction: 'Rec 20s wait time', humanAction: 'Rejected', outcome: 'No improvement', details: 'Operator opted for manual control' },
            { timestamp: '22/2-2026, 12:00', location: 'Jl. Basuki Rahmat', eventType: 'Incident', aiPrediction: 'Rec signal override', humanAction: 'Modified (+10s)', outcome: 'Smooth Traffic', details: 'Incident cleared within 15 min' },
            { timestamp: '21/2-2026, 17:30', location: 'Jl. Gubeng', eventType: 'Rush Hour', aiPrediction: 'Rec 45s green ext.', humanAction: 'Applied', outcome: 'Queue -40%', details: 'Queue reduced from 35 to 21 vehicles' },
            { timestamp: '21/2-2026, 16:00', location: 'Jl. Bronggalan', eventType: 'Traffic Congestion', aiPrediction: 'Rec 40s wait time', humanAction: 'No Action taken', outcome: 'Smooth Traffic', details: 'Traffic volume decreased naturally' },
            { timestamp: '20/2-2026, 08:15', location: 'Jl. Wiyung', eventType: 'School Zone', aiPrediction: 'Rec 50s red ext.', humanAction: 'Applied', outcome: 'Safe crossing', details: 'Pedestrian safety ensured' },
            { timestamp: '19/2-2026, 16:00', location: 'Jl. Ngagel', eventType: 'Traffic Congestion', aiPrediction: 'Rec 25s green ext.', humanAction: 'Applied', outcome: 'Smooth Traffic', details: 'Congestion resolved in 8 min' },
        ],
    },
    '30 days': {
        heatmap: [
            { day: 'Mon', cells: [0, 0, 1, 2, 2, 2, 1, 0], labels: [null, null, null, '78%', '96%', '91%', null, null] },
            { day: 'Tue', cells: [0, 0, 1, 2, 2, 1, 1, 0], labels: [null, null, null, null, '93%', null, null, null] },
            { day: 'Wed', cells: [0, 1, 1, 2, 2, 1, 1, 0], labels: [null, null, null, '82%', '90%', null, null, null] },
            { day: 'Thu', cells: [0, 0, 1, 1, 2, 1, 2, 1], labels: [null, null, null, null, '87%', null, '94%', null] },
            { day: 'Fri', cells: [0, 1, 1, 2, 2, 2, 1, 0], labels: [null, null, null, '85%', '97%', '89%', null, null] },
            { day: 'Sat', cells: [0, 0, 0, 1, 1, 1, 1, 0], labels: [null, null, null, null, null, null, null, null] },
            { day: 'Sun', cells: [0, 0, 0, 0, 1, 0, 1, 1], labels: [null, null, null, null, null, null, null, null] },
        ],
        acceptanceRate: 78,
        acceptanceTrend: 5,
        approved: 78,
        rejected: 14,
        modified: 8,
        recurringCauses: [
            { name: 'Accidents', percentage: 68 },
            { name: 'Weather', percentage: 52 },
            { name: 'Construction', percentage: 40 },
            { name: 'Signal fail', percentage: 22 },
        ],
        logs: [
            { timestamp: '22/2-2026, 14:30', location: 'Jl. Ahmad Yani', eventType: 'Traffic Congestion', aiPrediction: 'Rec 30s green ext.', humanAction: 'Applied', outcome: 'Congestion -18%', details: 'Density dropped from 92% to 74%' },
            { timestamp: '20/2-2026, 09:00', location: 'Jl. Mayjen Sungkono', eventType: 'Heavy Traffic', aiPrediction: 'Rec reroute northbound', humanAction: 'Applied', outcome: 'Speed +8 km/h', details: 'Alternative route reduced load' },
            { timestamp: '18/2-2026, 17:45', location: 'Jl. Tunjungan', eventType: 'Rush Hour', aiPrediction: 'Rec 60s cycle change', humanAction: 'Modified (+15s)', outcome: 'Queue -25%', details: 'Moderate improvement during peak' },
            { timestamp: '15/2-2026, 08:30', location: 'Jl. Pahlawan', eventType: 'Event Traffic', aiPrediction: 'Rec road closure assist', humanAction: 'Applied', outcome: 'Smooth Flow', details: 'Event crowd managed effectively' },
            { timestamp: '12/2-2026, 16:00', location: 'Jl. Darmo', eventType: 'Construction Zone', aiPrediction: 'Rec speed advisory', humanAction: 'Rejected', outcome: 'Minor delay', details: 'Construction ongoing, limited impact' },
            { timestamp: '10/2-2026, 07:30', location: 'Jl. Kenjeran', eventType: 'Morning Rush', aiPrediction: 'Rec 35s green ext.', humanAction: 'Applied', outcome: 'Congestion -22%', details: 'Morning peak managed well' },
            { timestamp: '08/2-2026, 13:00', location: 'Jl. Raya Arjuno', eventType: 'Incident', aiPrediction: 'Rec emergency override', humanAction: 'Applied', outcome: 'Cleared in 10 min', details: 'Ambulance corridor created' },
            { timestamp: '05/2-2026, 11:00', location: 'Jl. Kertajaya', eventType: 'Market Day', aiPrediction: 'Rec 20s red ext.', humanAction: 'No Action taken', outcome: 'Moderate delay', details: 'Market traffic dissipated by noon' },
            { timestamp: '02/2-2026, 15:30', location: 'Jl. Embong Malang', eventType: 'Traffic Congestion', aiPrediction: 'Rec signal sync', humanAction: 'Applied', outcome: 'Smooth Traffic', details: 'Green wave implemented across 3 intersections' },
        ],
    },
    '60 days': {
        heatmap: [
            { day: 'Mon', cells: [1, 1, 1, 2, 2, 2, 1, 1], labels: [null, null, null, '80%', '98%', '93%', null, null] },
            { day: 'Tue', cells: [0, 1, 1, 2, 2, 2, 1, 0], labels: [null, null, null, '76%', '95%', '88%', null, null] },
            { day: 'Wed', cells: [0, 1, 2, 2, 2, 2, 1, 1], labels: [null, null, '72%', '84%', '92%', '86%', null, null] },
            { day: 'Thu', cells: [0, 0, 1, 2, 2, 1, 2, 2], labels: [null, null, null, '79%', '91%', null, '96%', '88%'] },
            { day: 'Fri', cells: [1, 1, 2, 2, 2, 2, 2, 1], labels: [null, null, '75%', '88%', '99%', '94%', '90%', null] },
            { day: 'Sat', cells: [0, 0, 1, 1, 2, 1, 1, 1], labels: [null, null, null, null, '80%', null, null, null] },
            { day: 'Sun', cells: [0, 0, 0, 1, 1, 1, 1, 2], labels: [null, null, null, null, null, null, null, '82%'] },
        ],
        acceptanceRate: 72,
        acceptanceTrend: -3,
        approved: 72,
        rejected: 18,
        modified: 10,
        recurringCauses: [
            { name: 'Accidents', percentage: 82 },
            { name: 'Weather', percentage: 60 },
            { name: 'Construction', percentage: 48 },
            { name: 'Signal fail', percentage: 28 },
        ],
        logs: [
            { timestamp: '22/2-2026, 14:30', location: 'Jl. Ahmad Yani', eventType: 'Traffic Congestion', aiPrediction: 'Rec 30s green ext.', humanAction: 'Applied', outcome: 'Congestion -18%', details: 'Density dropped from 92% to 74%' },
            { timestamp: '15/2-2026, 08:30', location: 'Jl. Pahlawan', eventType: 'Event Traffic', aiPrediction: 'Rec road closure assist', humanAction: 'Applied', outcome: 'Smooth Flow', details: 'Event crowd managed effectively' },
            { timestamp: '08/2-2026, 13:00', location: 'Jl. Raya Arjuno', eventType: 'Incident', aiPrediction: 'Rec emergency override', humanAction: 'Applied', outcome: 'Cleared in 10 min', details: 'Ambulance corridor created' },
            { timestamp: '01/2-2026, 17:00', location: 'Jl. Dukuh Kupang', eventType: 'Rush Hour', aiPrediction: 'Rec 40s green ext.', humanAction: 'Modified (+20s)', outcome: 'Queue -30%', details: 'Partial improvement, manual adjustment needed' },
            { timestamp: '25/1-2026, 09:00', location: 'Jl. Raya Darmo', eventType: 'Heavy Rain', aiPrediction: 'Rec speed limit 30 km/h', humanAction: 'Applied', outcome: 'Zero accidents', details: 'Safety protocol effective' },
            { timestamp: '20/1-2026, 16:30', location: 'Jl. Tegalsari', eventType: 'Traffic Congestion', aiPrediction: 'Rec 25s green ext.', humanAction: 'Rejected', outcome: 'Delay +12 min', details: 'Operator chose manual timing' },
            { timestamp: '15/1-2026, 07:45', location: 'Jl. Wonokromo', eventType: 'Morning Rush', aiPrediction: 'Rec signal sync chain', humanAction: 'Applied', outcome: 'Speed +15 km/h', details: 'Green wave across 5 intersections' },
            { timestamp: '10/1-2026, 14:00', location: 'Jl. Jagir', eventType: 'Construction Zone', aiPrediction: 'Rec lane merge assist', humanAction: 'Applied', outcome: 'Smooth merge', details: 'No bottleneck formed' },
            { timestamp: '05/1-2026, 11:30', location: 'Jl. Kedungdoro', eventType: 'Market Day', aiPrediction: 'Rec pedestrian phase +10s', humanAction: 'No Action taken', outcome: 'Minor congestion', details: 'Cleared naturally by afternoon' },
            { timestamp: '01/1-2026, 18:00', location: 'Jl. Bubutan', eventType: 'New Year Traffic', aiPrediction: 'Rec full signal override', humanAction: 'Applied', outcome: 'Managed crowd', details: 'Large event handled with AI assistance' },
        ],
    },
};

const timeHeaders = ['12AM', '2AM', '4AM', '6AM', '8AM', '10AM', '12PM', '2PM'];

// ─── Component ──────────────────────────────────────────────────────────────

const Analytics = () => {
    const [activeRange, setActiveRange] = useState('7 days');
    const [searchQuery, setSearchQuery] = useState('');

    const timeRanges = ['7 days', '30 days', '60 days'];
    const data = dataByRange[activeRange];

    // Heatmap cell styling
    const getCellStyle = (level, label) => {
        const center = label ? ' flex items-center justify-center text-white text-[10px] font-bold' : '';
        if (level === 2) return `bg-primary shadow-lg shadow-primary/20${center}`;
        if (level === 1) return `bg-[#1e40af]${center}`;
        return `bg-[#1e293b]${center}`;
    };

    // Filtered logs
    const filteredLogs = useMemo(() =>
        data.logs.filter(log =>
            !searchQuery || Object.values(log).some(val =>
                val.toLowerCase().includes(searchQuery.toLowerCase())
            )
        ),
        [data.logs, searchQuery]
    );

    // Trend styling
    const trendPositive = data.acceptanceTrend >= 0;
    const trendColor = trendPositive ? 'text-green-500' : 'text-red-500';
    const trendBg = trendPositive ? 'bg-green-500/10' : 'bg-red-500/10';
    const trendIcon = trendPositive ? 'trending_up' : 'trending_down';

    // Outcome badge styling
    const getOutcomeStyle = (outcome) => {
        const lower = outcome.toLowerCase();
        if (lower.includes('smooth') || lower.includes('safe') || lower.includes('cleared') || lower.includes('zero') || lower.includes('managed') || lower.includes('speed +') || lower.includes('queue -') || lower.includes('congestion -'))
            return 'bg-green-500/10 text-green-400 border border-green-500/20';
        if (lower.includes('no improvement') || lower.includes('delay') || lower.includes('minor'))
            return 'bg-red-500/10 text-red-400 border border-red-500/20';
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
    };

    // Action badge styling
    const getActionStyle = (action) => {
        const lower = action.toLowerCase();
        if (lower.includes('applied')) return 'text-green-400';
        if (lower.includes('rejected')) return 'text-red-400';
        if (lower.includes('modified')) return 'text-yellow-400';
        return 'text-slate-400';
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
            <div className="space-y-8">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold text-white">History & Pattern Analysis</h1>
                        <p className="text-slate-400 text-sm mt-1">AI-powered traffic insights for Surabaya intersections</p>
                    </div>
                    <div className="bg-[#1e2433] rounded-lg p-1 flex border border-[#2a3441]">
                        {timeRanges.map((range) => (
                            <button
                                key={range}
                                onClick={() => { setActiveRange(range); setSearchQuery(''); }}
                                className={`px-6 py-2 rounded text-sm font-medium transition-all duration-200 ${activeRange === range
                                    ? 'bg-primary text-white font-bold shadow-lg shadow-primary/20'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Weekly Congestion Heatmap */}
                <section className="bg-[#161b26] rounded-xl border border-[#2a3441] p-6 lg:p-8">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-white mb-1">Weekly Congestion Heatmap</h2>
                        <p className="text-slate-400 text-sm">Intensity by Time of the Day vs Day of week — <span className="text-primary font-medium">{activeRange}</span></p>
                    </div>
                    <div className="overflow-x-auto">
                        <div className="min-w-[800px]">
                            {/* Time headers */}
                            <div className="grid grid-cols-[80px_repeat(8,1fr)] gap-2 mb-2 text-center">
                                <div></div>
                                {timeHeaders.map((time) => (
                                    <div key={time} className="text-xs font-semibold text-slate-300">{time}</div>
                                ))}
                            </div>
                            {/* Heatmap rows */}
                            {data.heatmap.map((row) => (
                                <div key={row.day} className="grid grid-cols-[80px_repeat(8,1fr)] gap-2 mb-2 items-center">
                                    <div className="text-sm font-medium text-slate-300 pl-2">{row.day}</div>
                                    {row.cells.map((level, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-10 rounded heatmap-cell transition-all duration-300 ${getCellStyle(level, row.labels[idx])}`}
                                            title={row.labels[idx] ? `Congestion: ${row.labels[idx]}` : `Level: ${['Low', 'Medium', 'High'][level]}`}
                                        >
                                            {row.labels[idx] && row.labels[idx]}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Heatmap Legend */}
                    <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#2a3441]">
                        <span className="text-xs text-slate-400">Intensity:</span>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-[#1e293b]"></div>
                            <span className="text-xs text-slate-400">Low</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-[#1e40af]"></div>
                            <span className="text-xs text-slate-400">Medium</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-primary shadow shadow-primary/30"></div>
                            <span className="text-xs text-slate-400">High</span>
                        </div>
                    </div>
                </section>

                {/* Two Column Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Rec. Acceptance Rate */}
                    <div className="bg-[#161b26] rounded-xl border border-[#2a3441] p-8 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-lg font-bold text-white">Rec. Acceptance Rate</h3>
                            <span className="material-symbols-outlined text-slate-500 text-[64px] opacity-20 absolute top-6 right-8">thumb_up</span>
                        </div>
                        <div className="flex items-end gap-3 mb-8 relative z-10">
                            <span className={`text-6xl font-bold ${trendPositive ? 'text-green-500' : 'text-red-400'}`}>
                                {data.acceptanceRate}%
                            </span>
                            <div className={`flex items-center ${trendColor} mb-2 gap-1 ${trendBg} px-2 py-1 rounded`}>
                                <span className="material-symbols-outlined text-[20px]">{trendIcon}</span>
                                <span className="text-sm font-bold">{Math.abs(data.acceptanceTrend)}%</span>
                            </div>
                        </div>
                        <div className="w-full h-4 bg-[#1e293b] rounded-full overflow-hidden flex mb-4">
                            <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${data.approved}%` }}></div>
                            <div className="h-full bg-slate-400 transition-all duration-500" style={{ width: `${data.modified}%` }}></div>
                            <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${data.rejected}%` }}></div>
                        </div>
                        <div className="flex gap-6 text-xs font-medium">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                <span className="text-slate-400">Approved ({data.approved}%)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-600"></span>
                                <span className="text-slate-400">Rejected ({data.rejected}%)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                <span className="text-slate-400">Modified ({data.modified}%)</span>
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
                            {data.recurringCauses.map((cause) => (
                                <div key={cause.name} className="grid grid-cols-[100px_1fr_40px] items-center gap-4">
                                    <span className="text-sm font-medium text-white">{cause.name}</span>
                                    <div className="h-2 w-full bg-[#1e293b] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                            style={{ width: `${cause.percentage}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm font-bold text-slate-300 text-right">{cause.percentage}%</span>
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
                            <p className="text-slate-400 text-sm">
                                Historical record of AI predictions vs Human actions
                                <span className="text-primary ml-2 font-medium">({filteredLogs.length} entries)</span>
                            </p>
                        </div>
                        <div className="relative w-full md:w-80">
                            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400">search</span>
                            <input
                                type="text"
                                placeholder="Search location, event, outcome..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#0B1120] border border-[#2a3441] text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder:text-slate-500"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-primary text-white text-sm">
                                    <th className="py-4 px-6 font-semibold whitespace-nowrap">Time Stamp</th>
                                    <th className="py-4 px-6 font-semibold whitespace-nowrap">Location</th>
                                    <th className="py-4 px-6 font-semibold whitespace-nowrap">Event Type</th>
                                    <th className="py-4 px-6 font-semibold whitespace-nowrap">AI Prediction</th>
                                    <th className="py-4 px-6 font-semibold whitespace-nowrap">Human Action</th>
                                    <th className="py-4 px-6 font-semibold whitespace-nowrap">Outcome</th>
                                    <th className="py-4 px-6 font-semibold whitespace-nowrap">Details</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-[#2a3441]">
                                {filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center">
                                            <div className="flex flex-col items-center text-slate-500">
                                                <span className="material-symbols-outlined text-[40px] mb-2 opacity-40">search_off</span>
                                                <p className="font-medium">No matching entries</p>
                                                <p className="text-xs mt-1">Try a different search term</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log, idx) => (
                                        <tr key={idx} className="hover:bg-[#1e2433] transition-colors group">
                                            <td className="py-4 px-6 text-white font-medium whitespace-nowrap">{log.timestamp}</td>
                                            <td className="py-4 px-6 text-slate-300 font-medium">{log.location}</td>
                                            <td className="py-4 px-6">
                                                <span className="text-slate-300">{log.eventType}</span>
                                            </td>
                                            <td className="py-4 px-6 text-blue-400 font-medium">{log.aiPrediction}</td>
                                            <td className="py-4 px-6">
                                                <span className={`font-semibold ${getActionStyle(log.humanAction)}`}>
                                                    {log.humanAction}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${getOutcomeStyle(log.outcome)}`}>
                                                    {log.outcome}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-slate-400 max-w-[200px] truncate" title={log.details}>
                                                {log.details}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Table Footer */}
                    <div className="p-4 border-t border-[#2a3441] flex justify-between items-center text-sm text-slate-400">
                        <span>Showing {filteredLogs.length} of {data.logs.length} entries</span>
                        <span className="text-xs text-slate-500">Data range: <span className="text-primary font-medium">{activeRange}</span></span>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Analytics;
