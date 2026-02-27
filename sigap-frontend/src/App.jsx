import React from 'react';
import CameraFeed from './components/CameraFeed';
import PredictionTimeline from './components/PredictionTimeline';
import { LayoutDashboard, Map, BarChart3, Settings, Bell } from 'lucide-react';

function App() {
  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-200 font-sans overflow-hidden">
      {/* Sidebar - Navigasi Samping */}
      <aside className="w-64 bg-[#1e293b] border-r border-slate-700 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl text-white">S</div>
          <h1 className="text-xl font-bold tracking-tight text-white uppercase">Sigap.AI</h1>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button className="flex items-center gap-3 w-full p-3 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-600/20 font-medium">
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
            <Map size={20} /> Live Map
          </button>
          <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
            <BarChart3 size={20} /> Analytics
          </button>
        </nav>

        <div className="pt-6 border-t border-slate-700">
          <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
            <Settings size={20} /> Settings
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8 bg-[#0f172a]">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">System Overview</h2>
            <p className="text-slate-400">Monitoring: Tomang Toll Exit Conflict Point</p>
          </div>
          <div className="flex items-center gap-4">
             <Bell className="text-slate-400 cursor-pointer hover:text-white" />
             <div className="w-10 h-10 rounded-full bg-blue-500 border-2 border-slate-700 flex items-center justify-center font-bold text-white">
              KD
            </div>
          </div>
        </header>

        {/* --- KOMPONEN HASIL KERJAMU --- */}
        <div className="space-y-8">
          {/* Grid Kamera (Cam 1 - Cam 4) [cite: 196-200] */}
          <CameraFeed />

          {/* Grafik Prediksi LSTM (60m Forecast) [cite: 220] */}
          <PredictionTimeline />
        </div>
      </main>
    </div>
  );
}

export default App;