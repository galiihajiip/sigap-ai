import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Camera,
  Clock,
  Gauge,
  Car,
  CloudRain,
  Thermometer,
  ArrowRight,
  X,
  Search,
  ZoomIn,
  ZoomOut,
  TrendingUp,
  Activity,
  Navigation,
  MapPin,
} from 'lucide-react';
import { LOCATIONS, useLocation } from '../context/LocationContext';

// -------------------------------------------------------
// Color helpers
// -------------------------------------------------------
const trafficConfig = {
  heavy: { fill: '#ef4444', stroke: '#991b1b', label: 'Heavy Traffic (>80%)', glow: 'rgba(239,68,68,0.4)' },
  slow: { fill: '#eab308', stroke: '#854d0e', label: 'Slow Traffic (50–80%)', glow: 'rgba(234,179,8,0.4)' },
  smooth: { fill: '#22c55e', stroke: '#14532d', label: 'Smooth (<50%)', glow: 'rgba(34,197,94,0.4)' },
};

// -------------------------------------------------------
// Fly-to helper on location select
// -------------------------------------------------------
function FlyToLocation({ location }) {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lng], 14, { duration: 1.2 });
    }
  }, [location, map]);
  return null;
}

// -------------------------------------------------------
// Location Info Panel (right sidebar)
// -------------------------------------------------------
const LocationPanel = ({ location, onClose, onViewDashboard }) => {
  if (!location) return null;
  const cfg = trafficConfig[location.trafficLevel];

  const riskColor =
    location.congestionRisk >= 70
      ? 'text-red-400'
      : location.congestionRisk >= 40
      ? 'text-yellow-400'
      : 'text-emerald-400';
  const riskBg =
    location.congestionRisk >= 70
      ? 'bg-red-500'
      : location.congestionRisk >= 40
      ? 'bg-yellow-400'
      : 'bg-emerald-400';

  return (
    <div className="absolute top-0 right-0 h-full w-[380px] z-[1000] flex flex-col">
      <div className="flex-1 bg-[#111722]/95 backdrop-blur-xl border-l border-[#2a3441] overflow-y-auto flex flex-col">
        {/* Panel Header */}
        <div className="sticky top-0 z-10 bg-[#161b26] border-b border-[#2a3441] p-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0 animate-pulse"
                style={{ backgroundColor: cfg.fill }}
              />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: cfg.fill }}>
                {location.trafficLevel === 'heavy'
                  ? 'Heavy Traffic'
                  : location.trafficLevel === 'slow'
                  ? 'Slow Traffic'
                  : 'Smooth Flow'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white leading-tight">{location.name}</h2>
            <p className="text-slate-400 text-sm flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />
              {location.city} • ID: #{location.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#2a3441] text-slate-400 hover:text-white transition-colors mt-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Snapshot */}
        <div className="p-5 border-b border-[#2a3441]">
          <div className="relative rounded-xl overflow-hidden h-48 bg-[#1e2433] group">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url('${location.cameras[0].image}')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-white bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30 tracking-wider">
                LIVE
              </span>
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
              <div>
                <p className="text-white font-bold text-sm">{location.cameras[0].name}</p>
                <p className={`text-xs mt-0.5 ${location.cameras[0].statusColor}`}>
                  {location.cameras[0].status}
                </p>
              </div>
              <Camera className="w-4 h-4 text-white/60" />
            </div>
          </div>
        </div>

        {/* Quick Stats 2×2 */}
        <div className="p-5 border-b border-[#2a3441]">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Gauge, label: 'Avg Speed', value: `${location.avgSpeed} km/h`, color: 'text-blue-400' },
              { icon: Car, label: 'Vehicles', value: `${location.vehicles}`, color: 'text-purple-400' },
              { icon: Clock, label: 'Wait Time', value: `${location.waitTime} min`, color: 'text-yellow-400' },
              { icon: Activity, label: 'Flow Rate', value: `${location.flowRate} cars/s`, color: 'text-emerald-400' },
            ].map((s) => (
              <div key={s.label} className="bg-[#1e2433] p-4 rounded-xl border border-[#2a3441] hover:border-[#3f4c61] transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <p className="text-slate-500 text-xs font-medium uppercase">{s.label}</p>
                </div>
                <p className="text-white font-bold text-lg">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Congestion Risk Bar */}
        <div className="p-5 border-b border-[#2a3441]">
          <div className="flex justify-between items-center mb-3">
            <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Congestion Risk
            </p>
            <p className={`font-bold text-xl font-mono ${riskColor}`}>{location.congestionRisk}%</p>
          </div>
          <div className="w-full bg-[#2a3441] h-2.5 rounded-full overflow-hidden">
            <div
              className={`${riskBg} h-full rounded-full transition-all duration-700`}
              style={{ width: `${location.congestionRisk}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-600 mt-1 px-0.5">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Weather */}
        <div className="p-5 border-b border-[#2a3441]">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">Kondisi Cuaca</p>
          <div className="flex items-center gap-4">
            <div className="bg-[#1e2433] p-3 rounded-xl border border-[#2a3441]">
              {location.trafficLevel === 'smooth' ? (
                <Thermometer className="w-6 h-6 text-orange-400" />
              ) : (
                <CloudRain className="w-6 h-6 text-blue-400" />
              )}
            </div>
            <div>
              <p className="text-white font-bold text-lg">{location.weather.temp}°C</p>
              <p className="text-slate-400 text-sm">{location.weather.desc}</p>
              <p className="text-slate-500 text-xs mt-0.5">Kelembapan {location.weather.humidity}%</p>
            </div>
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="p-5 border-b border-[#2a3441]">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#135bec] animate-pulse" />
            <p className="text-xs font-bold text-[#135bec] uppercase tracking-wider">AI Recommendation</p>
          </div>
          <div
            className={`p-4 rounded-xl border mb-3 ${
              location.congestionRisk >= 70
                ? 'bg-red-500/10 border-red-500/20'
                : location.congestionRisk >= 40
                ? 'bg-yellow-400/10 border-yellow-400/20'
                : 'bg-emerald-500/10 border-emerald-500/20'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle
                className={`w-4 h-4 ${
                  location.congestionRisk >= 70
                    ? 'text-red-400'
                    : location.congestionRisk >= 40
                    ? 'text-yellow-400'
                    : 'text-emerald-400'
                }`}
              />
              <p
                className={`font-bold text-sm ${
                  location.congestionRisk >= 70
                    ? 'text-red-400'
                    : location.congestionRisk >= 40
                    ? 'text-yellow-400'
                    : 'text-emerald-400'
                }`}
              >
                {location.recommendation.alert}
              </p>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">{location.recommendation.desc}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-[#1e2433] p-3 rounded-xl border border-[#2a3441]">
              <p className="text-slate-500 text-xs">Current Green</p>
              <p className="text-white font-mono font-bold text-base">{location.recommendation.currentGreen}</p>
            </div>
            <div className="bg-[#1e2433] p-3 rounded-xl border border-[#2a3441]">
              <p className="text-slate-500 text-xs">Recommended</p>
              <p className="text-[#135bec] font-mono font-bold text-base">
                {location.recommendation.recommended}{' '}
                <span className="text-xs text-green-400 font-normal">{location.recommendation.delta}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Prediction info */}
        <div className="p-5 border-b border-[#2a3441]">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center bg-[#1e2433] p-3 rounded-xl border border-[#2a3441]">
              <p className="text-slate-500 text-xs uppercase mb-1">Peak Time</p>
              <p className="text-white font-bold text-sm">{location.peakTime}</p>
            </div>
            <div className="text-center bg-[#1e2433] p-3 rounded-xl border border-[#2a3441]">
              <p className="text-slate-500 text-xs uppercase mb-1">Hotspots</p>
              <p
                className={`font-bold text-sm ${
                  location.criticalHotspots > 3
                    ? 'text-red-400'
                    : location.criticalHotspots > 0
                    ? 'text-yellow-400'
                    : 'text-emerald-400'
                }`}
              >
                {location.criticalHotspots}
              </p>
            </div>
            <div className="text-center bg-[#1e2433] p-3 rounded-xl border border-[#2a3441]">
              <p className="text-slate-500 text-xs uppercase mb-1">Net Vel.</p>
              <p className="text-white font-bold text-sm">{location.networkVelocity} km/h</p>
            </div>
          </div>
        </div>

        {/* CTA — View Dashboard */}
        <div className="p-5 mt-auto">
          <button
            onClick={onViewDashboard}
            className="w-full bg-[#135bec] hover:bg-[#0e4bce] text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-[#135bec]/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 group"
          >
            <Activity className="w-5 h-5" />
            <span>View Full Dashboard</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-center text-slate-600 text-xs mt-2">
            Dashboard akan menyesuaikan lokasi: {location.name}, {location.city}
          </p>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------
// Prediction sidebar (left)
// -------------------------------------------------------
const PredictionSidebar = ({ onSelectLocation }) => {
  return (
    <div className="absolute top-0 left-0 h-full w-[260px] z-[1000] bg-[#111722]/95 backdrop-blur-xl border-r border-[#2a3441] overflow-y-auto flex flex-col">
      <div className="p-5 border-b border-[#2a3441] bg-[#161b26]">
        <h2 className="text-white font-bold text-lg">Prediction Overview</h2>
        <p className="text-slate-500 text-xs mt-1">Real time congestion forecast for the next 60 minutes</p>
      </div>

      {/* Summary stats */}
      <div className="p-4 space-y-3 border-b border-[#2a3441]">
        {[
          {
            icon: AlertTriangle,
            iconColor: 'text-yellow-400',
            bg: 'bg-yellow-400/10 border-yellow-400/20',
            label: 'Critical HotSpots',
            value: LOCATIONS.reduce((a, l) => a + l.criticalHotspots, 0),
            sub: 'detected',
          },
          {
            icon: Navigation,
            iconColor: 'text-blue-400',
            bg: 'bg-blue-400/10 border-blue-400/20',
            label: 'Avg Network Velocity',
            value: `${Math.round(LOCATIONS.reduce((a, l) => a + l.networkVelocity, 0) / LOCATIONS.length)} km/h`,
            sub: '',
          },
          {
            icon: Clock,
            iconColor: 'text-purple-400',
            bg: 'bg-purple-400/10 border-purple-400/20',
            label: 'Peak Congestion',
            value: '17:45',
            sub: 'Pm',
          },
        ].map((s) => (
          <div key={s.label} className={`p-3 rounded-xl border ${s.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`w-4 h-4 ${s.iconColor}`} />
              <p className="text-slate-400 text-xs font-medium">{s.label}</p>
            </div>
            <p className="text-white font-bold text-xl">{s.value} <span className="text-slate-500 text-sm font-normal">{s.sub}</span></p>
          </div>
        ))}
      </div>

      {/* Top locations */}
      <div className="p-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Top Predictions</p>
        </div>
        <div className="space-y-2">
          {LOCATIONS.sort((a, b) => b.congestionRisk - a.congestionRisk).map((loc, i) => (
            <button
              key={loc.id}
              onClick={() => onSelectLocation(loc)}
              className="w-full text-left p-3 rounded-xl bg-[#1e2433] hover:bg-[#232a3b] border border-[#2a3441] hover:border-[#3f4c61] transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-slate-500 text-xs font-bold w-4 flex-shrink-0">{i + 1}.</span>
                  <div className="min-w-0">
                    <p className="text-white text-xs font-semibold truncate group-hover:text-[#135bec] transition-colors">
                      {loc.name}
                    </p>
                    <p className="text-slate-500 text-[10px]">{loc.city} • {loc.vehicles} vehicles</p>
                  </div>
                </div>
                <span
                  className="text-xs font-bold flex-shrink-0 ml-2"
                  style={{ color: trafficConfig[loc.trafficLevel].fill }}
                >
                  {loc.congestionRisk}%
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------
// Main LiveMap Page
// -------------------------------------------------------
const LiveMapPage = () => {
  const { selectedLocation, setSelectedLocation } = useLocation();
  const [panelLocation, setPanelLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const filtered = searchQuery
    ? LOCATIONS.filter(
        (l) =>
          l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.city.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : LOCATIONS;

  const handleMarkerClick = (loc) => {
    setSelectedLocation(loc);
    setPanelLocation(loc);
  };

  const handleViewDashboard = () => {
    setPanelLocation(null);
    navigate('/');
  };

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Left Prediction Sidebar */}
      <PredictionSidebar onSelectLocation={handleMarkerClick} />

      {/* Search Bar */}
      <div className="absolute top-4 left-[280px] z-[1000] right-[20px]"
           style={{ right: panelLocation ? '400px' : '20px' }}>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari lokasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111722]/90 backdrop-blur-xl border border-[#2a3441] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#135bec] transition-colors"
          />
        </div>
      </div>

      {/* Map */}
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{ left: '260px', right: panelLocation ? '380px' : '0px' }}
      >
        <MapContainer
          center={[-2.5, 117.0]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {panelLocation && <FlyToLocation location={panelLocation} />}

          {filtered.map((loc) => {
            const cfg = trafficConfig[loc.trafficLevel];
            const isSelected = selectedLocation?.id === loc.id;
            return (
              <CircleMarker
                key={loc.id}
                center={[loc.lat, loc.lng]}
                radius={isSelected ? 20 : 14}
                fillColor={cfg.fill}
                fillOpacity={isSelected ? 0.9 : 0.75}
                color={isSelected ? '#ffffff' : cfg.stroke}
                weight={isSelected ? 3 : 2}
                eventHandlers={{ click: () => handleMarkerClick(loc) }}
              >
                <Popup
                  className="leaflet-dark-popup"
                  closeButton={false}
                  offset={[0, -10]}
                >
                  <div className="bg-[#1e2433] text-white p-3 rounded-xl min-w-[160px]">
                    <p className="font-bold text-sm">{loc.name}</p>
                    <p className="text-slate-400 text-xs">{loc.city}</p>
                    <p className="mt-1 text-xs" style={{ color: cfg.fill }}>
                      {loc.congestionRisk}% Congestion
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-6 z-[1000] flex flex-col gap-2" style={{ left: '280px' }}>
        <button className="w-10 h-10 bg-[#1e2433] border border-[#2a3441] rounded-xl text-white hover:bg-[#2a3441] transition-colors flex items-center justify-center shadow-lg">
          <ZoomIn className="w-5 h-5" />
        </button>
        <button className="w-10 h-10 bg-[#1e2433] border border-[#2a3441] rounded-xl text-white hover:bg-[#2a3441] transition-colors flex items-center justify-center shadow-lg">
          <ZoomOut className="w-5 h-5" />
        </button>
      </div>

      {/* Legend */}
      <div
        className="absolute bottom-6 z-[1000] bg-[#111722]/90 backdrop-blur-xl border border-[#2a3441] rounded-xl p-3 shadow-xl"
        style={{ right: panelLocation ? '400px' : '16px' }}
      >
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Traffic Legend</p>
        {Object.entries(trafficConfig).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-2 mb-1.5 last:mb-0">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.fill }} />
            <span className="text-slate-400 text-xs">{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Location Info Panel (Right) */}
      {panelLocation && (
        <LocationPanel
          location={panelLocation}
          onClose={() => setPanelLocation(null)}
          onViewDashboard={handleViewDashboard}
        />
      )}
    </div>
  );
};

export default LiveMapPage;
