import React from 'react';

const stats = [
    {
        label: 'Congestion Risk',
        icon: 'trending_up',
        iconColor: 'text-red-500',
        iconBg: 'bg-red-500/10',
        value: 'High',
        change: '+12%',
        changeColor: 'text-red-500',
        bar: true,
        barPercent: 78,
        barColor: 'bg-red-500',
    },
    {
        label: 'Peak Forecast',
        icon: 'schedule',
        iconColor: 'text-[#135bec]',
        iconBg: 'bg-[#135bec]/10',
        value: '17:45',
        change: 'Today',
        changeColor: 'text-slate-400',
        footer: 'Based on historical data',
    },
    {
        label: 'Active Recs',
        icon: 'lightbulb',
        iconColor: 'text-yellow-400',
        iconBg: 'bg-yellow-400/10',
        value: '3',
        change: 'Pending',
        changeColor: 'text-yellow-400',
        circles: true,
    },
    {
        label: 'System Confidence',
        icon: 'verified',
        iconColor: 'text-green-500',
        iconBg: 'bg-green-500/10',
        value: '98%',
        change: 'Optimal',
        changeColor: 'text-green-500',
        bar: true,
        barPercent: 98,
        barColor: 'bg-green-500',
    },
];

const StatsRow = () => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {stats.map((stat) => (
                <div
                    key={stat.label}
                    className="bg-[#1e2433] p-5 rounded-lg border border-[#2a3441] flex flex-col justify-between hover:border-[#3f4c61] transition-colors"
                >
                    {/* Top row */}
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                        <span className={`material-symbols-outlined ${stat.iconColor} ${stat.iconBg} p-1 rounded`}>
                            {stat.icon}
                        </span>
                    </div>

                    {/* Value */}
                    <div className="flex items-end gap-2">
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                        <p className={`${stat.changeColor} text-sm font-medium mb-1`}>{stat.change}</p>
                    </div>

                    {/* Bottom element */}
                    {stat.bar && (
                        <div className="w-full bg-[#2a3441] h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className={`${stat.barColor} h-full rounded-full`} style={{ width: `${stat.barPercent}%` }} />
                        </div>
                    )}
                    {stat.footer && (
                        <p className="text-xs text-slate-500 mt-3">{stat.footer}</p>
                    )}
                    {stat.circles && (
                        <div className="flex -space-x-2 mt-3">
                            {[1, 2, 3].map((n) => (
                                <div key={n} className="h-6 w-6 rounded-full bg-slate-600 border border-[#1e2433] flex items-center justify-center text-[10px] text-white">
                                    {n}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default StatsRow;
