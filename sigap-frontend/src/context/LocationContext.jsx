import React, { createContext, useContext, useState } from 'react';

// -------------------------------------------------------
// Location data definitions – used on both Live Map & Dashboard
// -------------------------------------------------------
export const LOCATIONS = [
  {
    id: 'SBY-001',
    name: 'Jl. Soedirman',
    city: 'Surabaya',
    lat: -7.2678,
    lng: 112.7370,
    trafficLevel: 'heavy',    // heavy | slow | smooth
    congestionRisk: 82,
    avgSpeed: 15,
    queueLength: 48,
    waitTime: 14,
    flowRate: 12,
    vehicles: 380,
    weather: { temp: 32, desc: 'Berawan', humidity: 78 },
    peakTime: '17:45',
    networkVelocity: 22,
    criticalHotspots: 4,
    cameras: [
      { id: 1, name: 'Cam 1 – Soedirman N', status: 'Heavy Traffic', statusColor: 'text-red-400', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPNTQ7LPRPRg8B095T_AlgZDwilQvpLt8C-T8-7uBlvJl9OkueEFiaFpuXAinxaMP8QTXQ1ADcEN10YzxUU3xZZe4wystY5CaVogont9j49zeECVvj7I5YENUGIt40KTjb68TqxVoSm4Y0ywM4xzzHMAuL2QZe2i59QCzyCxB1aFJ7l721aPhfFLLovRVbjziir15JMadleY1TAoUYMfqol2HB2Bzv91oIpPDkKkqd4F24ZE_NEBN6bx4CO_wvbx_rxR6qG2Ryk8JI' },
      { id: 2, name: 'Cam 2 – Soedirman S', status: 'Slow Traffic', statusColor: 'text-yellow-400', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5qj4qrVO6bk4elHjX0Uu4Eqt4UxP7X9YPphNYi0Zl692KgaHMGfmSIMTIyA3hrdDnl15rDLORmPRN8a_i_ZxcaHRb0I9Do-TVTmaIqPWZZKKTZeFVWIl9uZr4jC5kZ74-P2yl7xlpTNXIp-HcgyZLeYvPAqcARxw45OxygzeEsyFB4o1OVZ_fu_iK0JNMthM-LRuwKyTFYwoHJ-h9ymD-XR_zjdsWS2Q2TNgueKjeTL4Kg-dxkT4cmo-euFm4zhjD6qOJhzZs8Gjd' },
      { id: 3, name: 'Cam 3 – Soedirman Int', status: 'Free Flow', statusColor: 'text-green-400', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDiXldbEvSZh6jHg57eJB-fZZVIF_692F3r5st1K8XJGZ-87NZBOWi_jQEWH_4AR58AmlIdjki4KgJlR4RuFVi_XeRpLhGgRPAaIRAut9ysKLDxYmwFhapVI0wB_24ratVrzvOHIbHL0-jsjsXcKLp0mAe6zjua3AXQZfWpa32FcpeUjfyDF3I_TMunEBqVCqUXow3kLXoDdUgM2XAAkD-LY5hN6nq8kkcMqFgRLQZGq9w2d_WNCdxAmB-9pv5EOE6fj-EUd04MAXQP' },
      { id: 4, name: 'Cam 4 – Soedirman W', status: 'Heavy Traffic', statusColor: 'text-red-400', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCk_8nJkzzYva_zpd64YnB19k6t92zBRT6FWFo0Smf991rKfKZx6uJkscEv9lJWNebr5mr9mMrF8qwBB16RcASEip3PicaItdp_nMIX6IWv3KKqrub5IRIiHZCUGxXWWsZiPIjahNErBYTvdwo31xX5PP7WJKvgUbxynYMBrAEDzH9U9hxQ9ecJdIsTptv3dpM2n9Snp2lYQE7CbcVlc5G5-RrV8tTAEHvjegMLePcQ7QUzx8BdgQ5JAoG-rnzD3OfvHEq8U3Nq9BXt' },
    ],
    recommendation: {
      alert: 'Critical Alert: Southbound Density',
      desc: 'Vehicles queuing beyond 200m. Predicted +14 min delay if signal timing is not adjusted immediately.',
      currentGreen: '45s',
      recommended: '65s',
      delta: '+20s',
    },
  },
  {
    id: 'PTK-001',
    name: 'Jl. Gajah Mada',
    city: 'Pontianak',
    lat: -0.0197,
    lng: 109.3426,
    trafficLevel: 'slow',
    congestionRisk: 56,
    avgSpeed: 28,
    queueLength: 22,
    waitTime: 7,
    flowRate: 24,
    vehicles: 210,
    weather: { temp: 29, desc: 'Hujan Ringan', humidity: 90 },
    peakTime: '16:30',
    networkVelocity: 28,
    criticalHotspots: 2,
    cameras: [
      { id: 1, name: 'Cam 1 – Gajah Mada N', status: 'Slow Traffic', statusColor: 'text-yellow-400', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCk_8nJkzzYva_zpd64YnB19k6t92zBRT6FWFo0Smf991rKfKZx6uJkscEv9lJWNebr5mr9mMrF8qwBB16RcASEip3PicaItdp_nMIX6IWv3KKqrub5IRIiHZCUGxXWWsZiPIjahNErBYTvdwo31xX5PP7WJKvgUbxynYMBrAEDzH9U9hxQ9ecJdIsTptv3dpM2n9Snp2lYQE7CbcVlc5G5-RrV8tTAEHvjegMLePcQ7QUzx8BdgQ5JAoG-rnzD3OfvHEq8U3Nq9BXt' },
      { id: 2, name: 'Cam 2 – Gajah Mada S', status: 'Moderate Flow', statusColor: 'text-slate-300', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPNTQ7LPRPRg8B095T_AlgZDwilQvpLt8C-T8-7uBlvJl9OkueEFiaFpuXAinxaMP8QTXQ1ADcEN10YzxUU3xZZe4wystY5CaVogont9j49zeECVvj7I5YENUGIt40KTjb68TqxVoSm4Y0ywM4xzzHMAuL2QZe2i59QCzyCxB1aFJ7l721aPhfFLLovRVbjziir15JMadleY1TAoUYMfqol2HB2Bzv91oIpPDkKkqd4F24ZE_NEBN6bx4CO_wvbx_rxR6qG2Ryk8JI' },
      { id: 3, name: 'Cam 3 – Gajah Mada E', status: 'Slow Traffic', statusColor: 'text-yellow-400', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDiXldbEvSZh6jHg57eJB-fZZVIF_692F3r5st1K8XJGZ-87NZBOWi_jQEWH_4AR58AmlIdjki4KgJlR4RuFVi_XeRpLhGgRPAaIRAut9ysKLDxYmwFhapVI0wB_24ratVrzvOHIbHL0-jsjsXcKLp0mAe6zjua3AXQZfWpa32FcpeUjfyDF3I_TMunEBqVCqUXow3kLXoDdUgM2XAAkD-LY5hN6nq8kkcMqFgRLQZGq9w2d_WNCdxAmB-9pv5EOE6fj-EUd04MAXQP' },
      { id: 4, name: 'Cam 4 – Gajah Mada W', status: 'Free Flow', statusColor: 'text-green-400', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5qj4qrVO6bk4elHjX0Uu4Eqt4UxP7X9YPphNYi0Zl692KgaHMGfmSIMTIyA3hrdDnl15rDLORmPRN8a_i_ZxcaHRb0I9Do-TVTmaIqPWZZKKTZeFVWIl9uZr4jC5kZ74-P2yl7xlpTNXIp-HcgyZLeYvPAqcARxw45OxygzeEsyFB4o1OVZ_fu_iK0JNMthM-LRuwKyTFYwoHJ-h9ymD-XR_zjdsWS2Q2TNgueKjeTL4Kg-dxkT4cmo-euFm4zhjD6qOJhzZs8Gjd' },
    ],
    recommendation: {
      alert: 'Warning: Hujan Lebat Diprediksi',
      desc: 'Curah hujan akan meningkat dalam 30 menit ke depan. Tambahan delay +7 menit diprediksi.',
      currentGreen: '40s',
      recommended: '50s',
      delta: '+10s',
    },
  },
  {
    id: 'JKT-001',
    name: 'Jl. Thamrin',
    city: 'Jakarta',
    lat: -6.1944,
    lng: 106.8229,
    trafficLevel: 'heavy',
    congestionRisk: 91,
    avgSpeed: 8,
    queueLength: 75,
    waitTime: 22,
    flowRate: 6,
    vehicles: 520,
    weather: { temp: 30, desc: 'Berawan Tebal', humidity: 85 },
    peakTime: '18:00',
    networkVelocity: 14,
    criticalHotspots: 7,
    cameras: [
      { id: 1, name: 'Cam 1 – Thamrin N', status: 'Heavy Traffic', statusColor: 'text-red-400', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPNTQ7LPRPRg8B095T_AlgZDwilQvpLt8C-T8-7uBlvJl9OkueEFiaFpuXAinxaMP8QTXQ1ADcEN10YzxUU3xZZe4wystY5CaVogont9j49zeECVvj7I5YENUGIt40KTjb68TqxVoSm4Y0ywM4xzzHMAuL2QZe2i59QCzyCxB1aFJ7l721aPhfFLLovRVbjziir15JMadleY1TAoUYMfqol2HB2Bzv91oIpPDkKkqd4F24ZE_NEBN6bx4CO_wvbx_rxR6qG2Ryk8JI' },
      { id: 2, name: 'Cam 2 – Thamrin S', status: 'Heavy Traffic', statusColor: 'text-red-400', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCk_8nJkzzYva_zpd64YnB19k6t92zBRT6FWFo0Smf991rKfKZx6uJkscEv9lJWNebr5mr9mMrF8qwBB16RcASEip3PicaItdp_nMIX6IWv3KKqrub5IRIiHZCUGxXWWsZiPIjahNErBYTvdwo31xX5PP7WJKvgUbxynYMBrAEDzH9U9hxQ9ecJdIsTptv3dpM2n9Snp2lYQE7CbcVlc5G5-RrV8tTAEHvjegMLePcQ7QUzx8BdgQ5JAoG-rnzD3OfvHEq8U3Nq9BXt' },
      { id: 3, name: 'Cam 3 – Thamrin Bundaran', status: 'Macet Total', statusColor: 'text-red-500', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDiXldbEvSZh6jHg57eJB-fZZVIF_692F3r5st1K8XJGZ-87NZBOWi_jQEWH_4AR58AmlIdjki4KgJlR4RuFVi_XeRpLhGgRPAaIRAut9ysKLDxYmwFhapVI0wB_24ratVrzvOHIbHL0-jsjsXcKLp0mAe6zjua3AXQZfWpa32FcpeUjfyDF3I_TMunEBqVCqUXow3kLXoDdUgM2XAAkD-LY5hN6nq8kkcMqFgRLQZGq9w2d_WNCdxAmB-9pv5EOE6fj-EUd04MAXQP' },
      { id: 4, name: 'Cam 4 – Thamrin Exit', status: 'Stop & Go', statusColor: 'text-orange-400', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5qj4qrVO6bk4elHjX0Uu4Eqt4UxP7X9YPphNYi0Zl692KgaHMGfmSIMTIyA3hrdDnl15rDLORmPRN8a_i_ZxcaHRb0I9Do-TVTmaIqPWZZKKTZeFVWIl9uZr4jC5kZ74-P2yl7xlpTNXIp-HcgyZLeYvPAqcARxw45OxygzeEsyFB4o1OVZ_fu_iK0JNMthM-LRuwKyTFYwoHJ-h9ymD-XR_zjdsWS2Q2TNgueKjeTL4Kg-dxkT4cmo-euFm4zhjD6qOJhzZs8Gjd' },
    ],
    recommendation: {
      alert: 'CRITICAL: Macet Parah — Rerouting Diperlukan',
      desc: 'Antrian kendaraan > 500m. Sistem merekomendasikan pembukaan jalur contra-flow segera.',
      currentGreen: '60s',
      recommended: '90s',
      delta: '+30s',
    },
  },
  {
    id: 'BDG-001',
    name: 'Jl. Asia Afrika',
    city: 'Bandung',
    lat: -6.9211,
    lng: 107.6069,
    trafficLevel: 'smooth',
    congestionRisk: 28,
    avgSpeed: 48,
    queueLength: 8,
    waitTime: 2,
    flowRate: 42,
    vehicles: 95,
    weather: { temp: 24, desc: 'Cerah', humidity: 65 },
    peakTime: '17:15',
    networkVelocity: 45,
    criticalHotspots: 0,
    cameras: [
      { id: 1, name: 'Cam 1 – Asia Afrika N', status: 'Free Flow', statusColor: 'text-green-400', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDiXldbEvSZh6jHg57eJB-fZZVIF_692F3r5st1K8XJGZ-87NZBOWi_jQEWH_4AR58AmlIdjki4KgJlR4RuFVi_XeRpLhGgRPAaIRAut9ysKLDxYmwFhapVI0wB_24ratVrzvOHIbHL0-jsjsXcKLp0mAe6zjua3AXQZfWpa32FcpeUjfyDF3I_TMunEBqVCqUXow3kLXoDdUgM2XAAkD-LY5hN6nq8kkcMqFgRLQZGq9w2d_WNCdxAmB-9pv5EOE6fj-EUd04MAXQP' },
      { id: 2, name: 'Cam 2 – Asia Afrika S', status: 'Free Flow', statusColor: 'text-green-400', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5qj4qrVO6bk4elHjX0Uu4Eqt4UxP7X9YPphNYi0Zl692KgaHMGfmSIMTIyA3hrdDnl15rDLORmPRN8a_i_ZxcaHRb0I9Do-TVTmaIqPWZZKKTZeFVWIl9uZr4jC5kZ74-P2yl7xlpTNXIp-HcgyZLeYvPAqcARxw45OxygzeEsyFB4o1OVZ_fu_iK0JNMthM-LRuwKyTFYwoHJ-h9ymD-XR_zjdsWS2Q2TNgueKjeTL4Kg-dxkT4cmo-euFm4zhjD6qOJhzZs8Gjd' },
      { id: 3, name: 'Cam 3 – Alun-alun', status: 'Moderate Flow', statusColor: 'text-slate-300', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPNTQ7LPRPRg8B095T_AlgZDwilQvpLt8C-T8-7uBlvJl9OkueEFiaFpuXAinxaMP8QTXQ1ADcEN10YzxUU3xZZe4wystY5CaVogont9j49zeECVvj7I5YENUGIt40KTjb68TqxVoSm4Y0ywM4xzzHMAuL2QZe2i59QCzyCxB1aFJ7l721aPhfFLLovRVbjziir15JMadleY1TAoUYMfqol2HB2Bzv91oIpPDkKkqd4F24ZE_NEBN6bx4CO_wvbx_rxR6qG2Ryk8JI' },
      { id: 4, name: 'Cam 4 – Braga St', status: 'Free Flow', statusColor: 'text-green-400', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCk_8nJkzzYva_zpd64YnB19k6t92zBRT6FWFo0Smf991rKfKZx6uJkscEv9lJWNebr5mr9mMrF8qwBB16RcASEip3PicaItdp_nMIX6IWv3KKqrub5IRIiHZCUGxXWWsZiPIjahNErBYTvdwo31xX5PP7WJKvgUbxynYMBrAEDzH9U9hxQ9ecJdIsTptv3dpM2n9Snp2lYQE7CbcVlc5G5-RrV8tTAEHvjegMLePcQ7QUzx8BdgQ5JAoG-rnzD3OfvHEq8U3Nq9BXt' },
    ],
    recommendation: {
      alert: 'System Normal — No Intervention Required',
      desc: 'Traffic flow is smooth. AI predicts no congestion in the next 60 minutes.',
      currentGreen: '35s',
      recommended: '35s',
      delta: '0s',
    },
  },
  {
    id: 'MDN-001',
    name: 'Jl. Gatot Subroto',
    city: 'Medan',
    lat: 3.5952,
    lng: 98.6722,
    trafficLevel: 'slow',
    congestionRisk: 61,
    avgSpeed: 24,
    queueLength: 32,
    waitTime: 10,
    flowRate: 18,
    vehicles: 290,
    weather: { temp: 33, desc: 'Panas Terik', humidity: 72 },
    peakTime: '17:00',
    networkVelocity: 26,
    criticalHotspots: 3,
    cameras: [
      { id: 1, name: 'Cam 1 – Gatot Sub N', status: 'Slow Traffic', statusColor: 'text-yellow-400', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCk_8nJkzzYva_zpd64YnB19k6t92zBRT6FWFo0Smf991rKfKZx6uJkscEv9lJWNebr5mr9mMrF8qwBB16RcASEip3PicaItdp_nMIX6IWv3KKqrub5IRIiHZCUGxXWWsZiPIjahNErBYTvdwo31xX5PP7WJKvgUbxynYMBrAEDzH9U9hxQ9ecJdIsTptv3dpM2n9Snp2lYQE7CbcVlc5G5-RrV8tTAEHvjegMLePcQ7QUzx8BdgQ5JAoG-rnzD3OfvHEq8U3Nq9BXt' },
      { id: 2, name: 'Cam 2 – Gatot Sub S', status: 'Moderate Flow', statusColor: 'text-slate-300', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPNTQ7LPRPRg8B095T_AlgZDwilQvpLt8C-T8-7uBlvJl9OkueEFiaFpuXAinxaMP8QTXQ1ADcEN10YzxUU3xZZe4wystY5CaVogont9j49zeECVvj7I5YENUGIt40KTjb68TqxVoSm4Y0ywM4xzzHMAuL2QZe2i59QCzyCxB1aFJ7l721aPhfFLLovRVbjziir15JMadleY1TAoUYMfqol2HB2Bzv91oIpPDkKkqd4F24ZE_NEBN6bx4CO_wvbx_rxR6qG2Ryk8JI' },
      { id: 3, name: 'Cam 3 – Kptn Patimura', status: 'Slow Traffic', statusColor: 'text-yellow-400', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDiXldbEvSZh6jHg57eJB-fZZVIF_692F3r5st1K8XJGZ-87NZBOWi_jQEWH_4AR58AmlIdjki4KgJlR4RuFVi_XeRpLhGgRPAaIRAut9ysKLDxYmwFhapVI0wB_24ratVrzvOHIbHL0-jsjsXcKLp0mAe6zjua3AXQZfWpa32FcpeUjfyDF3I_TMunEBqVCqUXow3kLXoDdUgM2XAAkD-LY5hN6nq8kkcMqFgRLQZGq9w2d_WNCdxAmB-9pv5EOE6fj-EUd04MAXQP' },
      { id: 4, name: 'Cam 4 – Ring Road', status: 'Moderate Flow', statusColor: 'text-slate-300', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5qj4qrVO6bk4elHjX0Uu4Eqt4UxP7X9YPphNYi0Zl692KgaHMGfmSIMTIyA3hrdDnl15rDLORmPRN8a_i_ZxcaHRb0I9Do-TVTmaIqPWZZKKTZeFVWIl9uZr4jC5kZ74-P2yl7xlpTNXIp-HcgyZLeYvPAqcARxw45OxygzeEsyFB4o1OVZ_fu_iK0JNMthM-LRuwKyTFYwoHJ-h9ymD-XR_zjdsWS2Q2TNgueKjeTL4Kg-dxkT4cmo-euFm4zhjD6qOJhzZs8Gjd' },
    ],
    recommendation: {
      alert: 'Warning: Volume Kendaraan Di Atas Rata-rata',
      desc: 'Flow kendaraan 30% di atas normal. Koordinasi sinyal perlu disesuaikan untuk mencegah bottleneck.',
      currentGreen: '42s',
      recommended: '55s',
      delta: '+13s',
    },
  },
];

// -------------------------------------------------------
// Context
// -------------------------------------------------------
const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
  const [selectedLocation, setSelectedLocation] = useState(LOCATIONS[0]);

  return (
    <LocationContext.Provider value={{ selectedLocation, setSelectedLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
};
