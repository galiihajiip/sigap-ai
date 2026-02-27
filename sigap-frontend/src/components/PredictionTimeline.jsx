import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const PredictionChart = () => {
  // Dummy data prediksi 60 menit ke depan sesuai prototipe
  const data = [
    { time: '17:00', volume: 420 },
    { time: '17:15', volume: 480 },
    { time: '17:30', volume: 550 },
    { time: '17:45', volume: 620 }, // Puncak prediksi melewati batas
    { time: '18:00', volume: 580 },
  ];

  return (
    <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 mb-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">Prediction Timeline (60m Forecast)</h3>
          <p className="text-slate-400 text-sm mt-1">AI Engine: LSTM Deep Learning</p>
        </div>
        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/30 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Model Active
        </span>
      </div>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
              itemStyle={{ color: '#3b82f6' }}
            />
            {/* Garis Batas Kritis (Threshold) */}
            <ReferenceLine y={600} label={{ position: 'top', value: 'Critical Threshold', fill: '#ef4444', fontSize: 12 }} stroke="#ef4444" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PredictionChart;