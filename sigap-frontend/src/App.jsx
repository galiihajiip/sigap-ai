import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AnalyticsPage from './pages/AnalyticsPage';
import { MapPin } from 'lucide-react';
import Header from './components/Header';
import CameraFeed from './components/CameraFeed';
import AIRecommendations from './components/AIRecommendations';
import AIPredictionEngine from './components/AIPredictionEngine';
import StatsRow from './components/StatsRow';
import PredictionTimeline from './components/PredictionTimeline';
import LiveMapPage from './pages/LiveMapPage';
import { LocationProvider, useLocation } from './context/LocationContext';
import { NotificationProvider } from './context/NotificationContext';
import SettingsPage from './pages/SettingsPage';

// -------------------------------------------------------
// Dashboard page
// -------------------------------------------------------
const DashboardPage = () => {
  const { selectedLocation } = useLocation();
  const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <main className="flex-1 p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
      {/* Page Title + System Status */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-[#135bec]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#135bec] bg-[#135bec]/10 px-3 py-1 rounded-full border border-[#135bec]/20">
              {selectedLocation?.name}, {selectedLocation?.city}
            </span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">System Overview</h2>
          <p className="text-slate-400">Real-time city congestion monitoring and AI intervention</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
          <span className="text-sm font-medium text-green-500">System Operational</span>
          <span className="text-slate-600 mx-2">|</span>
          <span className="text-sm text-slate-400">
            Last update: <span className="text-white font-mono">{now}</span>
          </span>
        </div>
      </div>

      {/* Camera Grid (2/3) + AI Recommendations (1/3) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-4">
          <CameraFeed />
        </div>
        <AIRecommendations />
      </div>

      {/* AI Prediction Engine */}
      <div className="mb-6">
        <AIPredictionEngine />
      </div>

      {/* Stats Row */}
      <StatsRow />

      {/* Prediction Timeline + Bottom Stats */}
      <PredictionTimeline />
    </main>
  );
}

function AppContent() {
  return (
    <div className="bg-[#101622] text-slate-100 font-[Space_Grotesk] antialiased min-h-screen flex flex-col overflow-x-hidden selection:bg-[#135bec] selection:text-white">
      <Header />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/live-map" element={<LiveMapPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <LocationProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </LocationProvider>
  );
}

export default App;