import React from 'react';

const CameraGrid = () => {
  // Data kamera berdasarkan studi kasus Tomang di proposal [cite: 5, 6, 7]
  const cameras = [
    { id: 1, name: 'Cam 1 - Tomang Exit (West)', status: 'LIVE' },
    { id: 2, name: 'Cam 2 - S. Parman Artery', status: 'LIVE' },
    { id: 3, name: 'Cam 3 - Slipi Approach', status: 'LIVE' },
    { id: 4, name: 'Cam 4 - Toll Main Lane (KM 10)', status: 'LIVE' },
  ];

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-white mb-4">System Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cameras.map((cam) => (
          <div key={cam.id} className="relative bg-slate-800 rounded-xl overflow-hidden border border-slate-700 aspect-video flex items-center justify-center">
            {/* Simulasi Feed Video */}
            <div className="text-slate-600 text-sm flex flex-col items-center gap-2">
              <div className="w-12 h-12 border-2 border-slate-700 rounded-full border-t-blue-500 animate-spin"></div>
              <span>Connecting to Stream...</span>
            </div>
            
            {/* Overlay Label Kamera [cite: 197-200] */}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-md text-[10px] text-white font-mono uppercase tracking-widest border border-white/10">
              {cam.name}
            </div>
            
            {/* Indikator Status [cite: 195] */}
            <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/40 px-2 py-1 rounded-md">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-[10px] text-red-500 font-bold uppercase">{cam.status}</span>
            </div>

            {/* Efek Scanline UI */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-10"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CameraGrid;