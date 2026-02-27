import React from 'react';
import { Maximize } from 'lucide-react';

const cameras = [
  {
    id: 1,
    name: 'Cam 1 - Main St.',
    status: 'Moderate Flow • 45 km/h',
    statusColor: 'text-slate-300',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPNTQ7LPRPRg8B095T_AlgZDwilQvpLt8C-T8-7uBlvJl9OkueEFiaFpuXAinxaMP8QTXQ1ADcEN10YzxUU3xZZe4wystY5CaVogont9j49zeECVvj7I5YENUGIt40KTjb68TqxVoSm4Y0ywM4xzzHMAuL2QZe2i59QCzyCxB1aFJ7l721aPhfFLLovRVbjziir15JMadleY1TAoUYMfqol2HB2Bzv91oIpPDkKkqd4F24ZE_NEBN6bx4CO_wvbx_rxR6qG2Ryk8JI',
  },
  {
    id: 2,
    name: 'Cam 2 - 5th Ave',
    status: '',
    statusColor: '',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5qj4qrVO6bk4elHjX0Uu4Eqt4UxP7X9YPphNYi0Zl692KgaHMGfmSIMTIyA3hrdDnl15rDLORmPRN8a_i_ZxcaHRb0I9Do-TVTmaIqPWZZKKTZeFVWIl9uZr4jC5kZ74-P2yl7xlpTNXIp-HcgyZLeYvPAqcARxw45OxygzeEsyFB4o1OVZ_fu_iK0JNMthM-LRuwKyTFYwoHJ-h9ymD-XR_zjdsWS2Q2TNgueKjeTL4Kg-dxkT4cmo-euFm4zhjD6qOJhzZs8Gjd',
  },
  {
    id: 3,
    name: 'Cam 3 - Broadway',
    status: 'Free Flow • 60 km/h',
    statusColor: 'text-slate-300',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDiXldbEvSZh6jHg57eJB-fZZVIF_692F3r5st1K8XJGZ-87NZBOWi_jQEWH_4AR58AmlIdjki4KgJlR4RuFVi_XeRpLhGgRPAaIRAut9ysKLDxYmwFhapVI0wB_24ratVrzvOHIbHL0-jsjsXcKLp0mAe6zjua3AXQZfWpa32FcpeUjfyDF3I_TMunEBqVCqUXow3kLXoDdUgM2XAAkD-LY5hN6nq8kkcMqFgRLQZGq9w2d_WNCdxAmB-9pv5EOE6fj-EUd04MAXQP',
  },
  {
    id: 4,
    name: 'Cam 4 - Market St.',
    status: 'Slow Traffic',
    statusColor: 'text-yellow-400 font-medium',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCk_8nJkzzYva_zpd64YnB19k6t92zBRT6FWFo0Smf991rKfKZx6uJkscEv9lJWNebr5mr9mMrF8qwBB16RcASEip3PicaItdp_nMIX6IWv3KKqrub5IRIiHZCUGxXWWsZiPIjahNErBYTvdwo31xX5PP7WJKvgUbxynYMBrAEDzH9U9hxQ9ecJdIsTptv3dpM2n9Snp2lYQE7CbcVlc5G5-RrV8tTAEHvjegMLePcQ7QUzx8BdgQ5JAoG-rnzD3OfvHEq8U3Nq9BXt',
  },
];

const CameraFeed = () => {
  return (
    <>
      {cameras.map((cam) => (
        <div
          key={cam.id}
          className="group relative bg-[#1e2433] rounded-lg overflow-hidden border border-[#2a3441] shadow-lg min-h-[200px]"
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url('${cam.image}')` }}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

          {/* LIVE Badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-red-500 live-indicator" />
            <span className="text-xs font-bold text-white tracking-wider bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">
              LIVE
            </span>
          </div>

          {/* Bottom Info */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
            <div>
              <p className="text-white font-bold text-sm">{cam.name}</p>
              {cam.status && (
                <p className={`text-xs mt-0.5 ${cam.statusColor}`}>
                  {cam.status}
                </p>
              )}
            </div>
            <Maximize className="w-5 h-5 text-white/70 hover:text-white cursor-pointer" />
          </div>
        </div>
      ))}
    </>
  );
};

export default CameraFeed;