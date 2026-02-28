import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom marker icons using colored circles
const createMarkerIcon = (color, glowColor) => {
    return L.divIcon({
        className: '',
        html: `
            <div style="position:relative;width:24px;height:24px;">
                <div style="position:absolute;inset:0;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 15px 2px ${glowColor};z-index:2;"></div>
                <div style="position:absolute;inset:0;border-radius:50%;background:${color};animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;opacity:0.75;"></div>
            </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -14],
    });
};

const yellowMarker = createMarkerIcon('#facc15', 'rgba(250,204,21,0.6)');
const blueMarker = createMarkerIcon('#135bec', 'rgba(19,91,236,0.6)');
const redMarker = createMarkerIcon('#ef4444', 'rgba(239,68,68,0.6)');

// Zoom control component
const ZoomControls = () => {
    const map = useMap();
    return (
        <div className="absolute bottom-6 left-6 z-[1000] flex flex-col gap-2">
            <button
                onClick={() => map.zoomIn()}
                className="h-10 w-10 bg-[#162032] border border-[#2a3649] rounded-lg text-white hover:bg-[#1e293b] flex items-center justify-center shadow-lg transition-colors"
            >
                <span className="material-symbols-outlined">add</span>
            </button>
            <button
                onClick={() => map.zoomOut()}
                className="h-10 w-10 bg-[#162032] border border-[#2a3649] rounded-lg text-white hover:bg-[#1e293b] flex items-center justify-center shadow-lg transition-colors"
            >
                <span className="material-symbols-outlined">remove</span>
            </button>
        </div>
    );
};

const LiveMap = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMarker, setSelectedMarker] = useState(null);

    // Surabaya center coordinates
    const mapCenter = [-7.2575, 112.7521];

    const markers = [
        {
            id: 1,
            position: [-7.265, 112.745],
            icon: yellowMarker,
            name: 'Jl. Diponegoro',
            status: 'Slow Traffic',
            statusColor: 'text-yellow-400',
            statusBg: 'border-yellow-500/30 bg-black/40',
            delay: '+15m',
            delayColor: 'text-yellow-500',
            queue: '>20 vehicles',
            waitTime: '45',
            flowRate: '12',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuR9JP-ibBq17P1Wmsf7h6iwMZz7GS2GKhIOOWqMfnR3ejA0D4SdhIOe2-yrKFMK-igyouU3k2O16lhXvkzHDlyxOLlGyf9MezGjeEbSTfvbR-dR1-HpJomyplxGBEHnfFMsFRfTN-N8g_c5GN_8ZdfZpuQNWAeQbfxpik9Fvlvk_k1dkMIKkb76jGPZ2S1fn_rTyyGXprgGlEDiTGGRnjnSb1jFBEW3cw8Jo6UgB5rpGy8GpaVmlda7P0OdEdd1TTIMuOKFGU59EH',
        },
        {
            id: 2,
            position: [-7.280, 112.760],
            icon: blueMarker,
            name: 'Jl. Kurbang',
            status: 'Moderate',
            statusColor: 'text-blue-400',
            statusBg: 'border-blue-500/30 bg-black/40',
            delay: '+8m',
            delayColor: 'text-blue-400',
            queue: '>10 vehicles',
            waitTime: '30',
            flowRate: '18',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPNTQ7LPRPRg8B095T_AlgZDwilQvpLt8C-T8-7uBlvJl9OkueEFiaFpuXAinxaMP8QTXQ1ADcEN10YzxUU3xZZe4wystY5CaVogont9j49zeECVvj7I5YENUGIt40KTjb68TqxVoSm4Y0ywM4xzzHMAuL2QZe2i59QCzyCxB1aFJ7l721aPhfFLLovRVbjziir15JMadleY1TAoUYMfqol2HB2Bzv91oIpPDkKkqd4F24ZE_NEBN6bx4CO_wvbx_rxR6qG2Ryk8JI',
        },
        {
            id: 3,
            position: [-7.290, 112.775],
            icon: redMarker,
            name: 'Jl. Ngagel',
            status: 'Heavy Traffic',
            statusColor: 'text-red-400',
            statusBg: 'border-red-500/30 bg-black/40',
            delay: '+25m',
            delayColor: 'text-red-500',
            queue: '>40 vehicles',
            waitTime: '90',
            flowRate: '5',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5qj4qrVO6bk4elHjX0Uu4Eqt4UxP7X9YPphNYi0Zl692KgaHMGfmSIMTIyA3hrdDnl15rDLORmPRN8a_i_ZxcaHRb0I9Do-TVTmaIqPWZZKKTZeFVWIl9uZr4jC5kZ74-P2yl7xlpTNXIp-HcgyZLeYvPAqcARxw45OxygzeEsyFB4o1OVZ_fu_iK0JNMthM-LRuwKyTFYwoHJ-h9ymD-XR_zjdsWS2Q2TNgueKjeTL4Kg-dxkT4cmo-euFm4zhjD6qOJhzZs8Gjd',
        },
    ];

    const activeMarker = selectedMarker ? markers.find(m => m.id === selectedMarker) : markers[0];

    return (
        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-[320px] shrink-0 bg-[#0B1120] border-r border-[#1e293b] flex flex-col overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-white mb-1">Prediction Overview</h2>
                    <p className="text-slate-400 text-xs mb-6">Real time congestion forecast for the next 60 minutes</p>

                    {/* Summary Cards */}
                    <div className="space-y-4">
                        <div className="sidebar-card-gradient rounded-xl p-4 border border-[#2a3649] relative overflow-hidden group hover:border-[#37465d] transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="material-symbols-outlined text-slate-400 text-[24px]">warning</span>
                                <h3 className="font-medium text-slate-200">Critical HotSpots</h3>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-bold text-white">3</span>
                                <span className="text-sm text-slate-400 mb-1.5">detected</span>
                            </div>
                        </div>

                        <div className="sidebar-card-gradient rounded-xl p-4 border border-[#2a3649] relative overflow-hidden group hover:border-[#37465d] transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="material-symbols-outlined text-slate-400 text-[24px]">speed</span>
                                <h3 className="font-medium text-slate-200">Avg Network Velocity</h3>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-bold text-white">24</span>
                                <span className="text-sm text-slate-400 mb-1.5">Km/h</span>
                            </div>
                            <div className="absolute right-[-10px] bottom-[-10px] opacity-10">
                                <span className="material-symbols-outlined text-[80px]">speed</span>
                            </div>
                        </div>

                        <div className="sidebar-card-gradient rounded-xl p-4 border border-[#2a3649] relative overflow-hidden group hover:border-[#37465d] transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="material-symbols-outlined text-slate-400 text-[24px]">schedule</span>
                                <h3 className="font-medium text-slate-200">Peak Congestion</h3>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-bold text-white">14:45</span>
                                <span className="text-sm text-slate-400 mb-1.5">PM</span>
                            </div>
                        </div>
                    </div>

                    {/* Top Predictions */}
                    <div className="mt-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">Top Predictions</h3>
                            <button className="text-xs text-primary hover:text-primary-hover font-medium">See All</button>
                        </div>
                        <div className="space-y-3">
                            {markers.map((marker, idx) => (
                                <button
                                    key={marker.id}
                                    onClick={() => setSelectedMarker(marker.id)}
                                    className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors border text-left ${selectedMarker === marker.id
                                            ? 'bg-[#162032] border-[#2a3649]'
                                            : 'border-transparent hover:bg-[#162032] hover:border-[#2a3649]'
                                        }`}
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#1e293b] text-white font-bold">{idx + 1}.</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-medium text-white truncate">{marker.name}</p>
                                            <span className={`text-xs font-bold ${marker.delayColor}`}>{marker.delay}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-0.5">Queue: {marker.queue}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Map Area */}
            <main className="flex-1 relative overflow-hidden">
                {/* Leaflet Map */}
                <MapContainer
                    center={mapCenter}
                    zoom={14}
                    className="absolute inset-0 w-full h-full z-0"
                    zoomControl={false}
                    attributionControl={false}
                    style={{ background: '#1a1a2e' }}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    {markers.map((marker) => (
                        <Marker
                            key={marker.id}
                            position={marker.position}
                            icon={marker.icon}
                            eventHandlers={{
                                click: () => setSelectedMarker(marker.id),
                            }}
                        >
                            <Popup>
                                <div className="text-sm font-bold">{marker.name}</div>
                                <div className="text-xs">{marker.status}</div>
                            </Popup>
                        </Marker>
                    ))}
                    <ZoomControls />
                </MapContainer>

                {/* Search Bar Overlay */}
                <div className="absolute top-6 left-6 z-[1000] w-80">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-300">
                            <span className="material-symbols-outlined">search</span>
                        </span>
                        <input
                            type="text"
                            placeholder="Search location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#162032] border border-[#2a3649] text-white text-sm rounded-full py-2.5 pl-10 pr-4 shadow-xl focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-slate-400"
                        />
                    </div>
                </div>

                {/* Right Side Overlay: Camera + Stats */}
                <div className="absolute top-6 right-6 z-[1000] w-[380px] space-y-3">
                    {/* Camera Feed */}
                    <div className="bg-[#162032]/95 backdrop-blur rounded-xl border border-[#2a3649] overflow-hidden shadow-2xl">
                        <div className="relative aspect-video bg-black">
                            <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: `url('${activeMarker.image}')` }}
                            ></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                            <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE
                            </div>
                            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                                <div>
                                    <h3 className="text-white font-bold text-sm drop-shadow-md">{activeMarker.name}</h3>
                                </div>
                                <span className={`${activeMarker.statusColor} font-bold text-xs ${activeMarker.statusBg} px-2 py-1 rounded backdrop-blur-sm border`}>
                                    {activeMarker.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#162032]/95 backdrop-blur p-4 rounded-xl border border-[#2a3649] shadow-xl flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-slate-300 text-sm font-medium">Wait Time</p>
                            </div>
                            <div className="flex justify-between items-end">
                                <div className="flex items-baseline gap-0.5">
                                    <span className="text-3xl font-bold text-white">{activeMarker.waitTime}</span>
                                    <span className="text-lg font-bold text-slate-400">+s</span>
                                </div>
                                <span className="material-symbols-outlined text-slate-400 text-[32px] opacity-50">traffic</span>
                            </div>
                        </div>
                        <div className="bg-[#162032]/95 backdrop-blur p-4 rounded-xl border border-[#2a3649] shadow-xl flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-slate-300 text-sm font-medium uppercase tracking-wide">Flow Rate</p>
                            </div>
                            <div className="flex justify-between items-end">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-white">{activeMarker.flowRate}</span>
                                    <span className="text-sm font-bold text-slate-400">Cars</span>
                                </div>
                                <span className="material-symbols-outlined text-slate-400 text-[32px] opacity-50">directions_car</span>
                            </div>
                        </div>
                    </div>

                    {/* Go to Dashboard Button */}
                    <button
                        onClick={() => navigate(`/?location=${encodeURIComponent(activeMarker.name)}`)}
                        className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-gradient-to-r from-[#1d8cf8] to-[#3b82f6] hover:from-[#2b97ff] hover:to-[#4f8ffc] text-white font-bold text-sm rounded-xl border border-[#3b82f6]/40 shadow-lg shadow-blue-500/20 transition-all duration-300 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] group"
                    >
                        <span className="material-symbols-outlined text-[20px] group-hover:translate-x-0.5 transition-transform">dashboard</span>
                        View in Dashboard
                        <span className="material-symbols-outlined text-[18px] ml-auto opacity-70 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                </div>

                {/* Traffic Legend */}
                <div className="absolute bottom-6 right-6 z-[1000] bg-[#162032]/90 backdrop-blur border border-[#2a3649] rounded-lg p-4 shadow-xl">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]"></div>
                            <span className="text-xs text-slate-300">Heavy Traffic ( &gt; 80%)</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]"></div>
                            <span className="text-xs text-slate-300">Slow Traffic (50% - 80%)</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                            <span className="text-xs text-slate-300">Smooth (&lt; 50%)</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LiveMap;
