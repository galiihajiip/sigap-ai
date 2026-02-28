import React, { useState, useEffect, useRef } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, ReferenceArea, Line,
    ComposedChart
} from 'recharts';

const MAX_POINTS = 120; // ~4 minutes at 2s interval

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const volume = payload.find(p => p.dataKey === 'volume');
    const predicted = payload.find(p => p.dataKey === 'predicted');

    return (
        <div className="bg-[#0f1a2e] border border-[#2a3441] rounded-lg p-3 shadow-2xl min-w-[180px]">
            <p className="text-slate-400 text-xs font-mono mb-2 border-b border-[#2a3441] pb-2">{label}</p>
            {volume && (
                <div className="flex items-center justify-between gap-4 mb-1">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></span>
                        <span className="text-slate-300 text-xs">Volume</span>
                    </div>
                    <span className="text-white font-mono font-bold text-sm">{volume.value}</span>
                </div>
            )}
            {predicted && predicted.value != null && (
                <div className="flex items-center justify-between gap-4 mb-1">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7]"></span>
                        <span className="text-slate-300 text-xs">Predicted</span>
                    </div>
                    <span className="text-purple-300 font-mono font-bold text-sm">{predicted.value}</span>
                </div>
            )}
            {volume && volume.value > 450 && (
                <div className="mt-2 pt-2 border-t border-red-500/20">
                    <span className="text-red-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                        Congestion Zone
                    </span>
                </div>
            )}
        </div>
    );
};

const CustomDot = ({ cx, cy, index, dataLength }) => {
    // Only show dot on the latest point
    if (index !== dataLength - 1) return null;
    return (
        <g>
            <circle cx={cx} cy={cy} r={6} fill="#3b82f6" opacity={0.3}>
                <animate attributeName="r" values="6;12;6" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx={cx} cy={cy} r={4} fill="#3b82f6" stroke="#fff" strokeWidth={2} />
        </g>
    );
};

const PredictionTimeline = ({ trafficData }) => {
    const [dataHistory, setDataHistory] = useState([]);
    const lastTimestampRef = useRef(null);

    useEffect(() => {
        if (!trafficData || !trafficData.timestamp) return;

        // Only add new data if timestamp changed
        if (lastTimestampRef.current === trafficData.timestamp) return;
        lastTimestampRef.current = trafficData.timestamp;

        const volume = trafficData.current_conditions?.volume || 0;
        const predicted = trafficData.prediction_15_mins?.predicted_volume || 0;
        const risk = trafficData.prediction_15_mins?.risk_level || 0;
        const time = trafficData.timestamp;

        setDataHistory(prev => {
            const newHistory = [...prev, { time, volume, predicted, risk }];
            // Keep only the last MAX_POINTS
            if (newHistory.length > MAX_POINTS) {
                return newHistory.slice(newHistory.length - MAX_POINTS);
            }
            return newHistory;
        });
    }, [trafficData]);

    // Generate forecast extension (projecting 8 future points from last data)
    const generateForecast = () => {
        if (dataHistory.length < 2) return [];

        const lastPoint = dataHistory[dataHistory.length - 1];
        const predicted = lastPoint.predicted;
        const current = lastPoint.volume;
        const diff = predicted - current;
        const forecast = [];

        for (let i = 1; i <= 8; i++) {
            const minutes = i * 2;
            const t = i / 8; // 0..1 interpolation factor
            // Smooth interpolation toward predicted volume
            const projectedVolume = Math.round(current + diff * t + (Math.random() * 10 - 5));

            // Parse last timestamp and increment
            const timeParts = lastPoint.time.split(':');
            const totalSeconds = parseInt(timeParts[0]) * 3600 + parseInt(timeParts[1]) * 60 + parseInt(timeParts[2]) + (minutes * 30);
            const h = Math.floor(totalSeconds / 3600) % 24;
            const m = Math.floor((totalSeconds % 3600) / 60);
            const s = totalSeconds % 60;
            const futureTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

            forecast.push({
                time: futureTime,
                volume: null, // no actual volume in the future
                predicted: projectedVolume,
                risk: lastPoint.risk,
                isForecast: true
            });
        }
        return forecast;
    };

    const forecastData = generateForecast();
    const chartData = [...dataHistory, ...forecastData];

    // Calculate Y-axis domain
    const allValues = chartData.flatMap(d => [d.volume, d.predicted].filter(v => v != null));
    const maxVal = Math.max(600, ...allValues);
    const yMax = Math.ceil(maxVal / 100) * 100;

    return (
        <div className="bg-surface-dark rounded-lg border border-[#2a3441] p-6 mb-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        Prediction Timeline
                        <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                    </h3>
                    <p className="text-slate-400 text-sm">
                        Live vehicle density — {dataHistory.length} data points collected
                    </p>
                </div>
                <div className="flex items-center gap-4 text-sm flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-0.5 bg-[#3b82f6] rounded-full block"></span>
                        <span className="text-slate-300 text-xs">Current Volume</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-0.5 bg-[#a855f7] rounded-full block" style={{ borderBottom: '2px dashed #a855f7' }}></span>
                        <span className="text-slate-300 text-xs">AI Predicted</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm bg-red-500/20 border border-red-500/40 block"></span>
                        <span className="text-slate-300 text-xs">Congestion Zone</span>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="w-full" style={{ height: 'clamp(220px, 30vw, 320px)' }}>
                {chartData.length < 2 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500">
                        <span className="material-symbols-outlined text-4xl mb-3 animate-pulse text-primary/50">monitoring</span>
                        <p className="text-sm font-medium">Collecting data points...</p>
                        <p className="text-xs text-slate-600 mt-1">Chart will appear after 2+ readings</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                                </linearGradient>
                                <linearGradient id="predictedGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#2a3441"
                                vertical={false}
                            />

                            {/* Congestion zone background */}
                            <ReferenceArea
                                y1={450}
                                y2={yMax}
                                fill="#ef4444"
                                fillOpacity={0.06}
                                stroke="#ef4444"
                                strokeOpacity={0.15}
                                strokeDasharray="4 4"
                            />

                            {/* Congestion threshold line */}
                            <ReferenceLine
                                y={450}
                                stroke="#ef4444"
                                strokeDasharray="6 3"
                                strokeOpacity={0.4}
                                label={{
                                    value: 'Congestion Threshold',
                                    position: 'insideTopRight',
                                    fill: '#ef4444',
                                    fontSize: 10,
                                    fontWeight: 'bold',
                                    opacity: 0.6
                                }}
                            />

                            {/* "Now" divider between real data and forecast */}
                            {forecastData.length > 0 && dataHistory.length > 0 && (
                                <ReferenceLine
                                    x={dataHistory[dataHistory.length - 1].time}
                                    stroke="#ffffff"
                                    strokeDasharray="4 2"
                                    strokeOpacity={0.3}
                                    label={{
                                        value: 'NOW',
                                        position: 'top',
                                        fill: '#fff',
                                        fontSize: 10,
                                        fontWeight: 'bold',
                                        offset: 10
                                    }}
                                />
                            )}

                            <XAxis
                                dataKey="time"
                                stroke="#475569"
                                tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
                                tickLine={false}
                                axisLine={{ stroke: '#2a3441' }}
                                interval="preserveStartEnd"
                                minTickGap={40}
                            />

                            <YAxis
                                stroke="#475569"
                                tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
                                tickLine={false}
                                axisLine={{ stroke: '#2a3441' }}
                                domain={[0, yMax]}
                                tickCount={6}
                                width={45}
                            />

                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{
                                    stroke: '#3b82f6',
                                    strokeWidth: 1,
                                    strokeDasharray: '4 4',
                                    strokeOpacity: 0.4
                                }}
                            />

                            {/* Current Volume Area */}
                            <Area
                                type="monotone"
                                dataKey="volume"
                                stroke="#3b82f6"
                                strokeWidth={2.5}
                                fill="url(#volumeGradient)"
                                connectNulls={false}
                                isAnimationActive={true}
                                animationDuration={500}
                                animationEasing="ease-out"
                                dot={(props) => (
                                    <CustomDot {...props} dataLength={dataHistory.length} />
                                )}
                                activeDot={{
                                    r: 5,
                                    fill: '#3b82f6',
                                    stroke: '#fff',
                                    strokeWidth: 2
                                }}
                            />

                            {/* Predicted Volume Line */}
                            <Area
                                type="monotone"
                                dataKey="predicted"
                                stroke="#a855f7"
                                strokeWidth={2}
                                strokeDasharray="6 3"
                                fill="url(#predictedGradient)"
                                connectNulls={true}
                                isAnimationActive={true}
                                animationDuration={500}
                                animationEasing="ease-out"
                                dot={false}
                                activeDot={{
                                    r: 4,
                                    fill: '#a855f7',
                                    stroke: '#fff',
                                    strokeWidth: 2
                                }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Bottom stats */}
            {dataHistory.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 pt-4 border-t border-[#2a3441]">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-500 text-[16px]">speed</span>
                        <span className="text-xs text-slate-400">Latest:</span>
                        <span className="text-xs text-white font-mono font-bold">
                            {dataHistory[dataHistory.length - 1].volume} veh
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-purple-400 text-[16px]">psychology</span>
                        <span className="text-xs text-slate-400">Predicted:</span>
                        <span className="text-xs text-purple-300 font-mono font-bold">
                            {dataHistory[dataHistory.length - 1].predicted} veh
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-500 text-[16px]">database</span>
                        <span className="text-xs text-slate-400">Points:</span>
                        <span className="text-xs text-white font-mono">{dataHistory.length}</span>
                    </div>
                    {dataHistory[dataHistory.length - 1].volume > 450 && (
                        <div className="flex items-center gap-2 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            <span className="text-xs text-red-400 font-bold">CONGESTION DETECTED</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PredictionTimeline;
