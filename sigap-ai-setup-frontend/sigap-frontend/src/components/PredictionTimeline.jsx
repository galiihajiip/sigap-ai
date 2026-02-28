import React from 'react';

const bottomStats = [
  {
    icon: 'queue_music',
    label: 'Queue Length',
    value: '45 cars',
    change: '12% vs avg',
    changeIcon: 'arrow_upward',
    changeColor: 'text-red-400',
  },
  {
    icon: 'timer',
    label: 'Wait Time',
    value: '12 mins',
    change: 'Moderate delay',
    changeColor: 'text-yellow-400',
  },
  {
    icon: 'wb_sunny',
    label: 'Weather',
    value: '30°C',
    change: 'Sunny, Clear visibility',
    changeColor: 'text-slate-400',
  },
  {
    icon: 'speed',
    label: 'Avg Speed',
    value: '15 km/h',
    change: '-5 km/h slowing',
    changeColor: 'text-red-400',
  },
  {
    icon: 'car_crash',
    label: 'Accidents',
    value: '0',
    change: 'None reported',
    changeColor: 'text-green-500',
  },
];

const PredictionTimeline = () => {
  return (
    <div className="space-y-6">
      {/* Chart Card */}
      <div className="bg-[#1e2433] rounded-lg border border-[#2a3441] p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Prediction Timeline</h3>
            <p className="text-slate-400 text-sm">Projected vehicle density over the next 4 hours</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-400/50" />
              <span className="text-slate-400">Historical</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#135bec]" />
              <span className="text-white font-medium">Predicted</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
              <span className="text-slate-400">Congestion Zone</span>
            </div>
          </div>
        </div>

        {/* SVG Chart */}
        <div className="relative h-64 w-full border-l border-b border-[#2a3441]">
          {/* Horizontal grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            <div className="w-full h-px bg-[#2a3441]/50" />
            <div className="w-full h-px bg-[#2a3441]/50" />
            <div className="w-full h-px bg-[#2a3441]/50" />
            <div className="w-full h-px bg-[#2a3441]/50" />
            <div className="w-full h-px bg-transparent" />
          </div>

          {/* Congestion Risk Zone */}
          <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-red-500/5 border-l border-b border-red-500/10 rounded-bl-xl pointer-events-none flex items-end justify-start p-2">
            <span className="text-xs text-red-500/50 font-bold uppercase">Congestion Risk Zone</span>
          </div>

          {/* SVG Lines */}
          <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none">
            {/* Historical dashed line */}
            <path
              className="opacity-50"
              d="M0,200 C50,190 100,180 150,160 C200,140 250,150 300,140 C350,130 400,110 450,120"
              fill="none"
              stroke="#64748b"
              strokeDasharray="4 4"
              strokeWidth="2"
            />

            {/* Area gradient definition */}
            <defs>
              <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#135bec" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#135bec" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Predicted area fill */}
            <path
              d="M450,120 C500,130 550,100 600,80 C650,60 700,50 750,55 C800,60 850,40 900,30 C950,20 1000,10 1200,5"
              fill="url(#areaGradient)"
              stroke="none"
            />

            {/* Predicted line */}
            <path
              d="M450,120 C500,130 550,100 600,80 C650,60 700,50 750,55 C800,60 850,40 900,30 C950,20 1000,10 1200,5"
              fill="none"
              stroke="#135bec"
              strokeLinecap="round"
              strokeWidth="3"
            />

            {/* "Now" vertical dashed line */}
            <line
              className="opacity-30"
              stroke="#fff"
              strokeDasharray="4 2"
              strokeWidth="1"
              x1="450" x2="450"
              y1="0" y2="256"
            />

            {/* "Now" dot */}
            <circle cx="450" cy="120" fill="#fff" r="4" />
          </svg>

          {/* "Now" label */}
          <div className="absolute top-[125px] left-[460px] bg-[#2a3441] text-xs px-2 py-1 rounded text-white border border-slate-600 shadow-lg z-10 hidden lg:block">
            Now
          </div>
        </div>

        {/* Time labels */}
        <div className="flex justify-between text-xs text-slate-500 mt-2 px-2">
          <span>14:00</span>
          <span>15:00</span>
          <span>16:00</span>
          <span>17:00</span>
          <span>18:00</span>
        </div>
      </div>

      {/* Bottom Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {bottomStats.map((stat) => (
          <div
            key={stat.label}
            className="bg-[#1e2433] p-4 rounded-lg border border-[#2a3441] hover:bg-[#232a3b] transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-slate-400 text-[20px]">{stat.icon}</span>
              <p className="text-slate-400 text-xs font-medium uppercase">{stat.label}</p>
            </div>
            <p className="text-xl font-bold text-white">{stat.value}</p>
            <p className={`text-xs mt-1 ${stat.changeColor} flex items-center`}>
              {stat.changeIcon && (
                <span className="material-symbols-outlined text-[14px]">{stat.changeIcon}</span>
              )}
              {stat.change}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PredictionTimeline;