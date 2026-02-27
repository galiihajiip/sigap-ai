import React, { useState, useEffect } from 'react';
import { Maximize, X, ChevronLeft, ChevronRight } from 'lucide-react';

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
    status: 'Heavy Traffic • 20 km/h',
    statusColor: 'text-red-400 font-medium',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5qj4qrVO6bk4elHjX0Uu4Eqt4UxP7X9YPphNYi0Zl692KgaHMGfmSIMTIyA3hrdDnl15rDLORmPRN8a_i_ZxcaHRb0I9Do-TVTmaIqPWZZKKTZeFVWIl9uZr4jC5kZ74-P2yl7xlpTNXIp-HcgyZLeYvPAqcARxw45OxygzeEsyFB4o1OVZ_fu_iK0JNMthM-LRuwKyTFYwoHJ-h9ymD-XR_zjdsWS2Q2TNgueKjeTL4Kg-dxkT4cmo-euFm4zhjD6qOJhzZs8Gjd',
  },
  {
    id: 3,
    name: 'Cam 3 - Broadway',
    status: 'Free Flow • 60 km/h',
    statusColor: 'text-green-400 font-medium',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDiXldbEvSZh6jHg57eJB-fZZVIF_692F3r5st1K8XJGZ-87NZBOWi_jQEWH_4AR58AmlIdjki4KgJlR4RuFVi_XeRpLhGgRPAaIRAut9ysKLDxYmwFhapVI0wB_24ratVrzvOHIbHL0-jsjsXcKLp0mAe6zjua3AXQZfWpa32FcpeUjfyDF3I_TMunEBqVCqUXow3kLXoDdUgM2XAAkD-LY5hN6nq8kkcMqFgRLQZGq9w2d_WNCdxAmB-9pv5EOE6fj-EUd04MAXQP',
  },
  {
    id: 4,
    name: 'Cam 4 - Market St.',
    status: 'Slow Traffic • 30 km/h',
    statusColor: 'text-yellow-400 font-medium',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCk_8nJkzzYva_zpd64YnB19k6t92zBRT6FWFo0Smf991rKfKZx6uJkscEv9lJWNebr5mr9mMrF8qwBB16RcASEip3PicaItdp_nMIX6IWv3KKqrub5IRIiHZCUGxXWWsZiPIjahNErBYTvdwo31xX5PP7WJKvgUbxynYMBrAEDzH9U9hxQ9ecJdIsTptv3dpM2n9Snp2lYQE7CbcVlc5G5-RrV8tTAEHvjegMLePcQ7QUzx8BdgQ5JAoG-rnzD3OfvHEq8U3Nq9BXt',
  },
];

const CameraFeed = () => {
  const [fullscreenIndex, setFullscreenIndex] = useState(null); // index into cameras[]

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setFullscreenIndex(null);
      if (e.key === 'ArrowRight' && fullscreenIndex !== null)
        setFullscreenIndex((i) => (i + 1) % cameras.length);
      if (e.key === 'ArrowLeft' && fullscreenIndex !== null)
        setFullscreenIndex((i) => (i - 1 + cameras.length) % cameras.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreenIndex]);

  const activeCam = fullscreenIndex !== null ? cameras[fullscreenIndex] : null;

  return (
    <>
      {/* ── Camera Grid Cards ─────────────────────────────── */}
      {cameras.map((cam, idx) => (
        <div
          key={cam.id}
          onClick={() => setFullscreenIndex(idx)}
          className="group relative bg-[#1e2433] rounded-lg overflow-hidden border border-[#2a3441] shadow-lg min-h-[200px] cursor-pointer"
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url('${cam.image}')` }}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

          {/* Hover expand hint */}
          <div className="absolute inset-0 bg-[#135bec]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* LIVE Badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-red-500 live-indicator" />
            <span className="text-xs font-bold text-white tracking-wider bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">
              LIVE
            </span>
          </div>

          {/* Maximize icon — top right */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-black/50 backdrop-blur-sm p-1.5 rounded-lg border border-white/10">
              <Maximize className="w-4 h-4 text-white" />
            </div>
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
          </div>
        </div>
      ))}

      {/* ── Fullscreen Lightbox ───────────────────────────── */}
      {activeCam && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center"
          onClick={() => setFullscreenIndex(null)}
        >
          {/* Top bar */}
          <div
            className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 live-indicator" />
              <span className="text-xs font-bold text-white tracking-wider bg-red-500/20 px-3 py-1 rounded border border-red-500/30">
                LIVE
              </span>
              <h2 className="text-white font-bold text-lg ml-2">{activeCam.name}</h2>
              {activeCam.status && (
                <span className={`text-sm ${activeCam.statusColor}`}>{activeCam.status}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-sm">{fullscreenIndex + 1} / {cameras.length}</span>
              <button
                onClick={() => setFullscreenIndex(null)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main image */}
          <div
            className="relative w-full h-full flex items-center justify-center px-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="w-full max-w-6xl aspect-video rounded-xl bg-cover bg-center shadow-2xl border border-white/10"
              style={{ backgroundImage: `url('${activeCam.image}')` }}
            />
          </div>

          {/* Prev / Next arrows */}
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-[#135bec]/80 text-white transition-colors border border-white/10 backdrop-blur-sm"
            onClick={(e) => { e.stopPropagation(); setFullscreenIndex((fullscreenIndex - 1 + cameras.length) % cameras.length); }}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-[#135bec]/80 text-white transition-colors border border-white/10 backdrop-blur-sm"
            onClick={(e) => { e.stopPropagation(); setFullscreenIndex((fullscreenIndex + 1) % cameras.length); }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Bottom thumbnail strip */}
          <div
            className="absolute bottom-6 flex items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {cameras.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setFullscreenIndex(i)}
                className={`relative w-20 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${i === fullscreenIndex ? 'border-[#135bec] scale-110 shadow-lg shadow-[#135bec]/30' : 'border-white/20 opacity-60 hover:opacity-100'
                  }`}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url('${c.image}')` }}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default CameraFeed;