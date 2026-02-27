import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import PredictionTimeline from '../components/PredictionTimeline';

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '');

const getYoutubeEmbedUrl = (url) => {
    if (!url) return "";
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${shortMatch[1]}&controls=0&rel=0`;
    const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
    if (longMatch) return `https://www.youtube.com/embed/${longMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${longMatch[1]}&controls=0&rel=0`;
    return "";
};

const formatTime = (rawValue) => {
    if (!rawValue) return new Date().toLocaleTimeString();
    const parsed = new Date(rawValue);
    if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleTimeString("id-ID", { hour12: false });
    }
    const text = String(rawValue);
    const hhmmss = text.match(/(\d{2}:\d{2}:\d{2})/);
    return hhmmss ? hhmmss[1] : text;
};

const Dashboard = () => {
    const [trafficData, setTrafficData] = useState(null);
    const [fetchError, setFetchError] = useState(null);
    const [isApplying, setIsApplying] = useState(false);
    const [notification, setNotification] = useState("");
    const [notifType, setNotifType] = useState("success"); // success | info | warning
    const [activeCam, setActiveCam] = useState(null);
    const [alertDismissed, setAlertDismissed] = useState(false);
    const [showAdjust, setShowAdjust] = useState(false);
    const [adjustDuration, setAdjustDuration] = useState(45);
    const [prevStatus, setPrevStatus] = useState(null);
    const [searchParams] = useSearchParams();
    const locationFromMap = searchParams.get('location');

    const fetchTraffic = async () => {
        try {
            const intersectionsRes = await axios.get(`${API_BASE}/api/intersections`);
            const intersections = intersectionsRes.data || [];
            const selectedIntersection = intersections[0];

            if (!selectedIntersection?.intersectionId) {
                throw new Error("Tidak ada intersection aktif dari backend.");
            }

            const intersectionId = selectedIntersection.intersectionId;
            const [liveRes, predRes, recRes] = await Promise.all([
                axios.get(`${API_BASE}/api/intersections/${intersectionId}/live`),
                axios.get(`${API_BASE}/api/intersections/${intersectionId}/prediction/15m`),
                axios.get(`${API_BASE}/api/recommendations/top`),
            ]);

            const live = liveRes.data?.live || {};
            const pred = predRes.data || {};
            const recs = recRes.data || [];
            const topRec = recs.find((r) =>
                r.targetIntersectionId === intersectionId && r.status === "PENDING"
            );

            const riskLabel = String(pred.riskLabel || "").toUpperCase();
            const isRiskHigh = riskLabel === "HIGH" || riskLabel === "CRITICAL";
            const isRiskWarning = riskLabel === "MODERATE";

            const currentGreen = topRec?.currentGreenSeconds ?? 45;
            const recommendedGreen =
                topRec?.recommendedGreenSeconds ??
                (isRiskHigh ? currentGreen + 20 : currentGreen);

            setTrafficData({
                intersection_id: intersectionId,
                recommendation_id: topRec?.recommendationId || null,
                status: isRiskHigh ? "DANGER" : isRiskWarning ? "WARNING" : "NORMAL",
                timestamp: formatTime(live.timestamp),
                current_conditions: {
                    volume: live.currentVolume ?? 0,
                    speed_kmh: live.avgSpeedKmh ?? 0,
                },
                prediction_15_mins: {
                    predicted_volume: pred.predictedVolume15m ?? live.currentVolume ?? 0,
                    risk_level: Math.round(pred.congestionRiskPercent ?? 0),
                    recommended_action:
                        topRec?.alertDescription || "Maintain current signal timings.",
                },
                queue_length: live.queueLengthVehicles ?? 0,
                wait_time_mins: Math.round(live.waitTimeMinutes ?? 0),
                weather: {
                    temp: live.weatherTempC ?? 30,
                    condition: live.weatherCondition || "Clear",
                },
                avg_speed_kmh: live.avgSpeedKmh ?? 0,
                accidents: live.accidentsCount ?? 0,
                system_confidence: Math.round(pred.systemConfidencePercent ?? 95),
                peak_forecast: pred.peakForecastTime || "--:--",
                current_green_duration: currentGreen,
                recommended_green_duration: recommendedGreen,
            });
            setFetchError(null);
        } catch (error) {
            console.error("Gagal mengambil data AI:", error);
            setFetchError(error.message);
        }
    };

    useEffect(() => {
        fetchTraffic();
        const interval = setInterval(fetchTraffic, 2000);
        return () => clearInterval(interval);
    }, []);

    // Reset alertDismissed when new DANGER status arrives
    useEffect(() => {
        if (trafficData) {
            const currentStatus = trafficData.status;
            const isCurrentDanger = currentStatus === "DANGER" || currentStatus === "WARNING";
            if (isCurrentDanger && prevStatus && prevStatus !== "DANGER" && prevStatus !== "WARNING") {
                setAlertDismissed(false);
            }
            setPrevStatus(currentStatus);
        }
    }, [trafficData]);

    const showNotif = (msg, type = "success", duration = 6000) => {
        setNotification(msg);
        setNotifType(type);
        setTimeout(() => setNotification(""), duration);
    };

    const handleApplyAction = async () => {
        if (!trafficData) return;
        setIsApplying(true);
        const gDiff = recommendedGreen - currentGreen;
        try {
            if (trafficData.recommendation_id) {
                await axios.post(
                    `${API_BASE}/api/recommendations/${trafficData.recommendation_id}/apply`
                );
            } else if (gDiff !== 0) {
                await axios.post(
                    `${API_BASE}/api/intersections/${trafficData.intersection_id}/adjust`,
                    { approach: "S", deltaSeconds: gDiff }
                );
            }
            setAlertDismissed(true);
            showNotif(`AI adjustment applied: +${gDiff}s (${currentGreen}s -> ${recommendedGreen}s).`, "success");
            fetchTraffic();
        } catch (error) {
            console.error("Failed to apply action:", error);
            showNotif("Gagal menerapkan rekomendasi AI ke backend.", "warning");
        }
        setIsApplying(false);
    };

    const handleReject = () => {
        setAlertDismissed(true);
        showNotif("⚠️ Alert Dismissed — AI recommendation rejected. Maintaining current signal timing at " + currentGreen + "s.", "warning");
    };

    const handleAdjustApply = async () => {
        setShowAdjust(false);
        const diff = adjustDuration - currentGreen;
        const sign = diff > 0 ? '+' : '';
        try {
            if (diff !== 0) {
                await axios.post(
                    `${API_BASE}/api/intersections/${trafficData.intersection_id}/adjust`,
                    { approach: "S", deltaSeconds: diff }
                );
            }
            setAlertDismissed(true);
            showNotif(`Manual override activated: ${adjustDuration}s (${sign}${diff}s).`, "success");
            fetchTraffic();
        } catch (error) {
            console.error("Failed to apply manual adjust:", error);
            showNotif("Gagal menerapkan manual override ke backend.", "warning");
        }
    };

    const handleAdjustSaveOnly = () => {
        setShowAdjust(false);
        showNotif(`💾 Adjustment Saved — ${adjustDuration}s configuration saved but NOT activated. You can apply it later.`, "info");
    };

    if (!trafficData) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-primary h-full w-full">
                {fetchError ? (
                    <div className="bg-red-500/10 border border-red-500 p-6 rounded-lg text-center max-w-lg">
                        <span className="material-symbols-outlined text-red-500 text-4xl mb-2">error</span>
                        <p className="font-bold text-red-500 text-xl mb-2">Koneksi ke AI Terputus!</p>
                        <p className="text-slate-300 mb-4">Pesan Error Asli: <code className="bg-black/50 p-1 rounded text-yellow-400">{fetchError}</code></p>
                        <p className="text-sm text-slate-400">Server Hugging Face mungkin sedang tertidur. Silakan tunggu 1-2 menit atau refresh halaman.</p>
                    </div>
                ) : (
                    <>
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-6"></div>
                        <p className="font-bold text-xl">Menghubungkan ke SIGAP AI Engine...</p>
                    </>
                )}
            </div>
        );
    }

    const { status, current_conditions, prediction_15_mins, timestamp } = trafficData;
    const isDanger = status === "DANGER" || status === "WARNING";
    const volume = current_conditions?.volume || 0;
    const speedKmh = current_conditions?.speed_kmh || 0;
    const predictedVolume = prediction_15_mins?.predicted_volume || 0;
    const riskLevel = prediction_15_mins?.risk_level || 0;
    const recommendation = prediction_15_mins?.recommended_action || "Maintain current signal timings.";

    // Derived fields from API
    const queueLength = trafficData.queue_length || 45;
    const waitTimeMins = trafficData.wait_time_mins || 12;
    const weather = trafficData.weather || { temp: 30, condition: "Sunny, Clear visibility" };
    const avgSpeed = trafficData.avg_speed_kmh || speedKmh;
    const accidents = trafficData.accidents || 0;
    const systemConfidence = trafficData.system_confidence || 98;
    const peakForecast = trafficData.peak_forecast || "17:45";
    const currentGreen = trafficData.current_green_duration || 45;
    const recommendedGreen = trafficData.recommended_green_duration || (isDanger ? 65 : 45);
    const greenDiff = recommendedGreen - currentGreen;

    const congestionRiskLabel = isDanger ? "High" : "Low";
    const congestionPercent = isDanger ? riskLevel : Math.min(riskLevel, 30);

    const cameraFeeds = [
        {
            name: "Cam 1 - Main St.",
            video: "https://www.youtube.com/watch?v=UBpyrHqLs6M",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCPNTQ7LPRPRg8B095T_AlgZDwilQvpLt8C-T8-7uBlvJl9OkueEFiaFpuXAinxaMP8QTXQ1ADcEN10YzxUU3xZZe4wystY5CaVogont9j49zeECVvj7I5YENUGIt40KTjb68TqxVoSm4Y0ywM4xzzHMAuL2QZe2i59QCzyCxB1aFJ7l721aPhfFLLovRVbjziir15JMadleY1TAoUYMfqol2HB2Bzv91oIpPDkKkqd4F24ZE_NEBN6bx4CO_wvbx_rxR6qG2Ryk8JI",
            subtitle: `Moderate Flow • ${Math.round(speedKmh)} km/h`,
            subtitleClass: "text-slate-300"
        },
        {
            name: "Cam 2 - 5th Ave",
            video: "https://www.youtube.com/watch?v=OjEMBdLXIfI",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC5qj4qrVO6bk4elHjX0Uu4Eqt4UxP7X9YPphNYi0Zl692KgaHMGfmSIMTIyA3hrdDnl15rDLORmPRN8a_i_ZxcaHRb0I9Do-TVTmaIqPWZZKKTZeFVWIl9uZr4jC5kZ74-P2yl7xlpTNXIp-HcgyZLeYvPAqcARxw45OxygzeEsyFB4o1OVZ_fu_iK0JNMthM-LRuwKyTFYwoHJ-h9ymD-XR_zjdsWS2Q2TNgueKjeTL4Kg-dxkT4cmo-euFm4zhjD6qOJhzZs8Gjd",
            subtitle: null,
            subtitleClass: ""
        },
        {
            name: "Cam 3 - Broadway",
            video: "https://www.youtube.com/watch?v=j6Oh5Zwhelo",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDiXldbEvSZh6jHg57eJB-fZZVIF_692F3r5st1K8XJGZ-87NZBOWi_jQEWH_4AR58AmlIdjki4KgJlR4RuFVi_XeRpLhGgRPAaIRAut9ysKLDxYmwFhapVI0wB_24ratVrzvOHIbHL0-jsjsXcKLp0mAe6zjua3AXQZfWpa32FcpeUjfyDF3I_TMunEBqVCqUXow3kLXoDdUgM2XAAkD-LY5hN6nq8kkcMqFgRLQZGq9w2d_WNCdxAmB-9pv5EOE6fj-EUd04MAXQP",
            subtitle: "Free Flow • 60 km/h",
            subtitleClass: "text-slate-300"
        },
        {
            name: "Cam 4 - Market St.",
            video: "https://www.youtube.com/watch?v=vcUdVJfyvF8",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCk_8nJkzzYva_zpd64YnB19k6t92zBRT6FWFo0Smf991rKfKZx6uJkscEv9lJWNebr5mr9mMrF8qwBB16RcASEip3PicaItdp_nMIX6IWv3KKqrub5IRIiHZCUGxXWWsZiPIjahNErBYTvdwo31xX5PP7WJKvgUbxynYMBrAEDzH9U9hxQ9ecJdIsTptv3dpM2n9Snp2lYQE7CbcVlc5G5-RrV8tTAEHvjegMLePcQ7QUzx8BdgQ5JAoG-rnzD3OfvHEq8U3Nq9BXt",
            subtitle: isDanger ? "Slow Traffic" : "Normal Flow",
            subtitleClass: isDanger ? "text-yellow-400 font-medium" : "text-slate-300"
        }
    ];

    return (
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="flex flex-col w-full max-w-[1600px] mx-auto text-slate-100">
                {/* Notification Banner */}
                {notification && (
                    <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 animate-notif-slide ${notifType === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-400' :
                        notifType === 'info' ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400' :
                            'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
                        }`}>
                        <span className="material-symbols-outlined text-[18px]">
                            {notifType === 'success' ? 'check_circle' : notifType === 'info' ? 'info' : 'warning'}
                        </span>
                        <span className="flex-1">{notification}</span>
                        <button onClick={() => setNotification("")} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                    </div>
                )}

                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">System Overview</h2>
                        <p className="text-slate-400">Real-time city congestion monitoring and AI intervention</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="text-sm font-medium text-green-500">System Operational</span>
                        <span className="text-slate-600 mx-2">|</span>
                        <span className="text-sm text-slate-400">Last update: <span className="text-white font-mono">{timestamp || new Date().toLocaleTimeString()}</span></span>
                    </div>
                </div>

                {/* Main Grid: Camera Feeds + AI Panel */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                    {/* Camera Feeds 2x2 */}
                    <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cameraFeeds.map((cam, idx) => (
                            <div key={idx} className="group relative aspect-video bg-surface-dark rounded-lg overflow-hidden border border-[#2a3441] shadow-lg">
                                {cam.video && getYoutubeEmbedUrl(cam.video) ? (
                                    <iframe
                                        className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-105"
                                        src={getYoutubeEmbedUrl(cam.video)}
                                        title={cam.name}
                                        allow="autoplay; encrypted-media; picture-in-picture"
                                        allowFullScreen
                                    />
                                ) : cam.video ? (
                                    <video
                                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        src={cam.video}
                                        poster={cam.image}
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                    />
                                ) : (
                                    <div
                                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                                        style={{ backgroundImage: `url('${cam.image}')` }}
                                    ></div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40"></div>
                                <div className="absolute top-4 left-4 flex items-center gap-2">
                                    <span className="flex h-2 w-2 rounded-full bg-red-500 live-indicator"></span>
                                    <span className="text-xs font-bold text-white tracking-wider bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">LIVE</span>
                                </div>
                                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                    <div>
                                        <p className="text-white font-bold text-sm">{cam.name}</p>
                                        {cam.subtitle && (
                                            <p className={`text-xs mt-0.5 ${cam.subtitleClass}`}>{cam.subtitle}</p>
                                        )}
                                    </div>
                                    <button onClick={() => setActiveCam(cam)} className="bg-black/40 hover:bg-black/70 p-1.5 rounded-lg transition-colors">
                                        <span className="material-symbols-outlined text-white/70 hover:text-white">fullscreen</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* AI Recommendations Panel */}
                    <div className="xl:col-span-1 flex flex-col h-full bg-surface-dark rounded-lg border border-[#2a3441] overflow-hidden shadow-lg">
                        <div className="p-5 border-b border-[#2a3441] flex justify-between items-center bg-surface-darker">
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">smart_toy</span>
                                Top Recommendations
                            </h3>
                            <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded border border-primary/20">AI ACTIVE</span>
                        </div>
                        <div className="p-6 flex flex-col justify-between flex-1 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

                            <div className="space-y-6">
                                {/* Target Location */}
                                <div className="flex items-start gap-4">
                                    <div className="bg-[#2a3441] p-3 rounded-lg text-white">
                                        <span className="material-symbols-outlined text-[28px]">location_on</span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Target Location</p>
                                        <p className="text-white text-xl font-bold leading-tight">{locationFromMap || 'Jl. Soedirman, Surabaya'}</p>
                                        <p className="text-sm text-slate-400 mt-1">Intersection ID: #SUR-4092</p>
                                    </div>
                                </div>

                                {/* Alert */}
                                {isDanger && !alertDismissed ? (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <span className="material-symbols-outlined text-red-500 mt-0.5">warning</span>
                                            <div>
                                                <p className="text-red-400 font-bold text-sm mb-1">Critical Alert: Southbound Density</p>
                                                <p className="text-slate-300 text-sm leading-relaxed">
                                                    {recommendation}. Predicted +15 min delay if signal timing is not adjusted immediately.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <span className="material-symbols-outlined text-green-500 mt-0.5">check_circle</span>
                                            <div>
                                                <p className="text-green-400 font-bold text-sm mb-1">{alertDismissed ? 'Alert Dismissed' : 'Traffic Flow Normal'}</p>
                                                <p className="text-slate-300 text-sm leading-relaxed">
                                                    {alertDismissed ? 'Operator dismissed AI recommendation. Manual control active.' : 'No immediate AI intervention required. Maintaining current signal cycle.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Signal Timing */}
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="bg-[#2a3441]/50 p-3 rounded border border-[#2a3441]">
                                        <p className="text-slate-400 text-xs">Current Green</p>
                                        <p className="text-white font-mono font-bold text-lg">{currentGreen}s</p>
                                    </div>
                                    <div className="bg-[#2a3441]/50 p-3 rounded border border-[#2a3441]">
                                        <p className="text-slate-400 text-xs">Recommended</p>
                                        <p className="text-primary font-mono font-bold text-lg">
                                            {recommendedGreen}s {greenDiff > 0 && <span className="text-xs font-normal text-green-400">(+{greenDiff}s)</span>}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3 mt-8">
                                <button
                                    onClick={handleApplyAction}
                                    disabled={!isDanger || isApplying || alertDismissed}
                                    className={`w-full py-3 px-4 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 group font-bold ${!isDanger || isApplying || alertDismissed
                                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/20'
                                        }`}
                                >
                                    {isApplying ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                    ) : (
                                        <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">auto_fix</span>
                                    )}
                                    {isApplying ? "Applying AI Adjustment..." : "Apply AI Adjustment"}
                                </button>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={handleReject}
                                        className="bg-red-600/90 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg border border-red-700 transition-colors shadow-lg shadow-red-600/10"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => { setShowAdjust(true); setAdjustDuration(recommendedGreen); }}
                                        className="bg-blue-600/90 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg border border-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">tune</span>
                                        Adjust
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── AI Prediction Engine Panel ─────────────────── */}
                <div className="bg-gradient-to-r from-[#0f1a2e] to-[#162032] rounded-lg border border-primary/20 p-6 mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-0 pointer-events-none"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="bg-primary/20 p-2 rounded-lg">
                                <span className="material-symbols-outlined text-primary text-[28px]">psychology</span>
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg">AI Prediction Engine</h3>
                                <p className="text-slate-400 text-sm">LSTM Neural Network — Real-time 15-minute forecast</p>
                            </div>
                            <span className="ml-auto bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-500/30 flex items-center gap-1.5">
                                <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                                MODEL ACTIVE
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Current Volume (Input) */}
                            <div className="bg-[#1a2744]/80 p-5 rounded-xl border border-[#2a3441]">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-slate-400 text-[20px]">input</span>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Input — Current Volume</p>
                                </div>
                                <p className="text-3xl font-bold text-white font-mono">{volume}</p>
                                <p className="text-xs text-slate-500 mt-2">vehicles/cycle (simulated sensor)</p>
                            </div>

                            {/* Arrow */}
                            <div className="hidden md:flex items-center justify-center">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-16 h-px bg-gradient-to-r from-slate-600 to-primary"></div>
                                        <div className="bg-primary/20 p-3 rounded-xl border border-primary/30">
                                            <span className="material-symbols-outlined text-primary text-[32px]">neurology</span>
                                        </div>
                                        <div className="w-16 h-px bg-gradient-to-r from-primary to-slate-600"></div>
                                    </div>
                                    <p className="text-xs text-primary font-bold uppercase tracking-widest">LSTM Model</p>
                                    <p className="text-[10px] text-slate-500">sigap_model.h5</p>
                                </div>
                            </div>

                            {/* Predicted Volume (Output) */}
                            <div className={`p-5 rounded-xl border ${isDanger ? 'bg-red-500/10 border-red-500/30' : 'bg-primary/10 border-primary/30'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-primary text-[20px]">output</span>
                                    <p className={`text-xs font-bold uppercase tracking-wider ${isDanger ? 'text-red-400' : 'text-primary'}`}>Output — Predicted Volume</p>
                                </div>
                                <div className="flex items-end gap-3">
                                    <p className={`text-3xl font-bold font-mono ${isDanger ? 'text-red-400' : 'text-primary'}`}>{predictedVolume}</p>
                                    {predictedVolume > volume && (
                                        <span className="text-red-400 text-sm font-medium mb-1 flex items-center">
                                            <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                                            +{predictedVolume - volume}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-2">predicted in 15 minutes</p>
                                <div className="mt-3 flex items-center gap-2">
                                    <div className={`h-2 flex-1 rounded-full overflow-hidden bg-[#2a3441]`}>
                                        <div className={`h-full rounded-full transition-all duration-700 ${riskLevel > 75 ? 'bg-red-500' : riskLevel > 50 ? 'bg-yellow-500' : 'bg-primary'}`} style={{ width: `${riskLevel}%` }}></div>
                                    </div>
                                    <span className={`text-xs font-bold ${riskLevel > 75 ? 'text-red-400' : riskLevel > 50 ? 'text-yellow-400' : 'text-primary'}`}>{riskLevel}%</span>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1">congestion risk level</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {/* Congestion Risk */}
                    <div className="bg-surface-dark p-5 rounded-lg border border-[#2a3441] flex flex-col justify-between hover:border-[#3f4c61] transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-slate-400 text-sm font-medium">Congestion Risk</p>
                            <span className={`material-symbols-outlined ${isDanger ? 'text-red-500 bg-red-500/10' : 'text-green-500 bg-green-500/10'} p-1 rounded`}>trending_up</span>
                        </div>
                        <div className="flex items-end gap-2">
                            <p className="text-2xl font-bold text-white">{congestionRiskLabel}</p>
                            {isDanger && <p className="text-red-500 text-sm font-medium mb-1">+12%</p>}
                        </div>
                        <div className="w-full bg-[#2a3441] h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className={`h-full rounded-full ${isDanger ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${congestionPercent}%` }}></div>
                        </div>
                    </div>

                    {/* Peak Forecast */}
                    <div className="bg-surface-dark p-5 rounded-lg border border-[#2a3441] flex flex-col justify-between hover:border-[#3f4c61] transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-slate-400 text-sm font-medium">Peak Forecast</p>
                            <span className="material-symbols-outlined text-primary bg-primary/10 p-1 rounded">schedule</span>
                        </div>
                        <div className="flex items-end gap-2">
                            <p className="text-2xl font-bold text-white">{peakForecast}</p>
                            <p className="text-slate-400 text-sm font-medium mb-1">Today</p>
                        </div>
                        <p className="text-xs text-slate-500 mt-3">Based on historical data</p>
                    </div>

                    {/* Active Recs */}
                    <div className="bg-surface-dark p-5 rounded-lg border border-[#2a3441] flex flex-col justify-between hover:border-[#3f4c61] transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-slate-400 text-sm font-medium">Active Recs</p>
                            <span className="material-symbols-outlined text-yellow-400 bg-yellow-400/10 p-1 rounded">lightbulb</span>
                        </div>
                        <div className="flex items-end gap-2">
                            <p className="text-2xl font-bold text-white">{isDanger ? 3 : 0}</p>
                            <p className="text-yellow-400 text-sm font-medium mb-1">Pending</p>
                        </div>
                        <div className="flex -space-x-2 mt-3">
                            <div className="h-6 w-6 rounded-full bg-slate-600 border border-surface-dark flex items-center justify-center text-[10px] text-white">1</div>
                            <div className="h-6 w-6 rounded-full bg-slate-600 border border-surface-dark flex items-center justify-center text-[10px] text-white">2</div>
                            <div className="h-6 w-6 rounded-full bg-slate-600 border border-surface-dark flex items-center justify-center text-[10px] text-white">3</div>
                        </div>
                    </div>

                    {/* System Confidence */}
                    <div className="bg-surface-dark p-5 rounded-lg border border-[#2a3441] flex flex-col justify-between hover:border-[#3f4c61] transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-slate-400 text-sm font-medium">System Confidence</p>
                            <span className="material-symbols-outlined text-green-500 bg-green-500/10 p-1 rounded">verified</span>
                        </div>
                        <div className="flex items-end gap-2">
                            <p className="text-2xl font-bold text-white">{systemConfidence}%</p>
                            <p className="text-green-500 text-sm font-medium mb-1">Optimal</p>
                        </div>
                        <div className="w-full bg-[#2a3441] h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="bg-green-500 h-full rounded-full" style={{ width: `${systemConfidence}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Prediction Timeline — Dynamic Real-Time */}
                <PredictionTimeline trafficData={trafficData} />

                {/* Bottom Metrics Row */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="bg-surface-dark p-4 rounded-lg border border-[#2a3441] hover:bg-[#232a3b] transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-slate-400 text-[20px]">queue_music</span>
                            <p className="text-slate-400 text-xs font-medium uppercase">Queue Length</p>
                        </div>
                        <p className="text-xl font-bold text-white">{queueLength} cars</p>
                        <p className="text-xs text-red-400 mt-1 flex items-center">
                            <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 12% vs avg
                        </p>
                    </div>

                    <div className="bg-surface-dark p-4 rounded-lg border border-[#2a3441] hover:bg-[#232a3b] transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-slate-400 text-[20px]">timer</span>
                            <p className="text-slate-400 text-xs font-medium uppercase">Wait Time</p>
                        </div>
                        <p className="text-xl font-bold text-white">{waitTimeMins} mins</p>
                        <p className="text-xs text-yellow-400 mt-1">Moderate delay</p>
                    </div>

                    <div className="bg-surface-dark p-4 rounded-lg border border-[#2a3441] hover:bg-[#232a3b] transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-slate-400 text-[20px]">wb_sunny</span>
                            <p className="text-slate-400 text-xs font-medium uppercase">Weather</p>
                        </div>
                        <p className="text-xl font-bold text-white">{weather.temp}°C</p>
                        <p className="text-xs text-slate-400 mt-1">{weather.condition}</p>
                    </div>

                    <div className="bg-surface-dark p-4 rounded-lg border border-[#2a3441] hover:bg-[#232a3b] transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-slate-400 text-[20px]">speed</span>
                            <p className="text-slate-400 text-xs font-medium uppercase">Avg Speed</p>
                        </div>
                        <p className="text-xl font-bold text-white">{Math.round(avgSpeed)} km/h</p>
                        <p className="text-xs text-red-400 mt-1">-5 km/h slowing</p>
                    </div>

                    <div className="bg-surface-dark p-4 rounded-lg border border-[#2a3441] hover:bg-[#232a3b] transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-slate-400 text-[20px]">car_crash</span>
                            <p className="text-slate-400 text-xs font-medium uppercase">Accidents</p>
                        </div>
                        <p className="text-xl font-bold text-white">{accidents}</p>
                        <p className="text-xs text-green-500 mt-1">None reported</p>
                    </div>
                </div>

                {/* ─── Camera Fullscreen Modal ──────────────────────── */}
                {activeCam && (
                    <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 animate-notif-slide" onClick={() => setActiveCam(null)}>
                        <div className="relative w-full max-w-5xl aspect-video rounded-xl overflow-hidden shadow-2xl border border-[#2a3441]" onClick={(e) => e.stopPropagation()}>
                            {/* Camera image */}
                            <div className="absolute inset-0">
                                {activeCam.video && getYoutubeEmbedUrl(activeCam.video) ? (
                                    <iframe
                                        className="h-full w-full"
                                        src={getYoutubeEmbedUrl(activeCam.video)}
                                        title={activeCam.name}
                                        allow="autoplay; encrypted-media; picture-in-picture"
                                        allowFullScreen
                                    />
                                ) : activeCam.video ? (
                                    <video
                                        className="h-full w-full object-cover"
                                        src={activeCam.video}
                                        poster={activeCam.image}
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        controls
                                    />
                                ) : (
                                    <div
                                        className="h-full w-full bg-cover bg-center"
                                        style={{ backgroundImage: `url('${activeCam.image}')` }}
                                    ></div>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30"></div>

                            {/* LIVE badge */}
                            <div className="absolute top-6 left-6 flex items-center gap-2">
                                <span className="flex h-3 w-3 rounded-full bg-red-500 live-indicator"></span>
                                <span className="text-sm font-bold text-white tracking-wider bg-red-500/30 px-3 py-1 rounded-lg border border-red-500/40">LIVE</span>
                            </div>

                            {/* Close button */}
                            <button
                                onClick={() => setActiveCam(null)}
                                className="absolute top-6 right-6 bg-black/50 hover:bg-red-600 text-white p-2 rounded-lg transition-colors border border-white/10"
                            >
                                <span className="material-symbols-outlined text-[24px]">close</span>
                            </button>

                            {/* Camera info overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-white font-bold text-xl">{activeCam.name}</p>
                                        {activeCam.subtitle && (
                                            <p className={`text-sm mt-1 ${activeCam.subtitleClass}`}>{activeCam.subtitle}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
                                            <span className="text-xs text-slate-400">Resolution</span>
                                            <p className="text-white text-sm font-bold">1080p</p>
                                        </div>
                                        <div className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
                                            <span className="text-xs text-slate-400">FPS</span>
                                            <p className="text-white text-sm font-bold">30</p>
                                        </div>
                                        <div className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
                                            <span className="text-xs text-slate-400">Latency</span>
                                            <p className="text-white text-sm font-bold">120ms</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Adjust Slider Modal ──────────────────────────── */}
                {showAdjust && (
                    <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4 animate-notif-slide" onClick={() => setShowAdjust(false)}>
                        <div className="bg-[#162032] border border-[#2a3649] rounded-2xl p-8 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-600/20 p-2 rounded-lg">
                                        <span className="material-symbols-outlined text-blue-400">tune</span>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">Manual Signal Adjust</h3>
                                        <p className="text-slate-400 text-xs">Override AI recommendation</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowAdjust(false)} className="text-slate-400 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            {/* Current vs Override */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-[#1e293b] p-4 rounded-xl border border-[#2a3441] text-center">
                                    <p className="text-slate-400 text-xs mb-1">Current</p>
                                    <p className="text-white font-mono text-2xl font-bold">{currentGreen}s</p>
                                </div>
                                <div className="bg-primary/10 p-4 rounded-xl border border-primary/30 text-center">
                                    <p className="text-primary text-xs mb-1 font-medium">Your Override</p>
                                    <p className="text-primary font-mono text-2xl font-bold">{adjustDuration}s</p>
                                </div>
                            </div>

                            {/* Slider */}
                            <div className="mb-8">
                                <label className="text-sm text-slate-300 font-medium mb-3 block">Green Light Duration</label>
                                <input
                                    type="range"
                                    min="10"
                                    max="120"
                                    value={adjustDuration}
                                    onChange={(e) => setAdjustDuration(Number(e.target.value))}
                                    className="w-full h-2 bg-[#2a3441] rounded-full cursor-pointer"
                                    style={{ background: `linear-gradient(to right, #1d8cf8 0%, #1d8cf8 ${((adjustDuration - 10) / 110) * 100}%, #2a3441 ${((adjustDuration - 10) / 110) * 100}%, #2a3441 100%)` }}
                                />
                                <div className="flex justify-between text-xs text-slate-500 mt-2">
                                    <span>10s</span>
                                    <span>60s</span>
                                    <span>120s</span>
                                </div>
                            </div>

                            {/* Diff indicator */}
                            {adjustDuration !== currentGreen && (
                                <div className={`mb-6 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${adjustDuration > currentGreen ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                    }`}>
                                    <span className="material-symbols-outlined text-[18px]">{adjustDuration > currentGreen ? 'add_circle' : 'remove_circle'}</span>
                                    {adjustDuration > currentGreen ? '+' : ''}{adjustDuration - currentGreen}s from current timing
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleAdjustApply}
                                    className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition-colors shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                    Apply & Activate ({adjustDuration}s)
                                </button>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowAdjust(false)}
                                        className="flex-1 py-3 rounded-xl border border-[#2a3441] text-slate-300 hover:text-white hover:border-slate-500 font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAdjustSaveOnly}
                                        className="flex-1 py-3 rounded-xl bg-[#1e293b] hover:bg-[#283548] text-blue-400 font-medium transition-colors border border-blue-500/20 flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">save</span>
                                        Save Only
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;

