import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';

const Header = () => {
    const [showNotifications, setShowNotifications] = useState(false);
    const notifRef = useRef(null);

    const [notifications, setNotifications] = useState([
        {
            id: 1,
            icon: 'warning',
            iconColor: 'text-red-400',
            iconBg: 'bg-red-500/10',
            title: 'Critical Congestion Detected',
            desc: 'Jl. Ahmad Yani — density at 92%, AI recommends rerouting.',
            time: '2 min ago',
            read: false,
        },
        {
            id: 2,
            icon: 'traffic',
            iconColor: 'text-yellow-400',
            iconBg: 'bg-yellow-500/10',
            title: 'Slow Traffic Alert',
            desc: 'Jl. Diponegoro — speed dropped to 15 km/h in the last 10 minutes.',
            time: '8 min ago',
            read: false,
        },
        {
            id: 3,
            icon: 'check_circle',
            iconColor: 'text-green-400',
            iconBg: 'bg-green-500/10',
            title: 'Signal Timing Applied',
            desc: 'AI recommendation accepted for INT-0042, green extended to 65s.',
            time: '15 min ago',
            read: false,
        },
        {
            id: 4,
            icon: 'videocam',
            iconColor: 'text-blue-400',
            iconBg: 'bg-blue-500/10',
            title: 'Camera Feed Restored',
            desc: 'Cam 3 — Jl. Rungkut feed is back online after 12 min outage.',
            time: '32 min ago',
            read: true,
        },
        {
            id: 5,
            icon: 'update',
            iconColor: 'text-slate-400',
            iconBg: 'bg-slate-500/10',
            title: 'System Update Available',
            desc: 'TrafficAI v2.4.1 — includes improved prediction models.',
            time: '1 hr ago',
            read: true,
        },
    ]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const dismissNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navItems = [
        { name: 'Dashboard', path: '/' },
        { name: 'Analytics', path: '/analytics' },
        { name: 'Live Map', path: '/livemap' },
        { name: 'Settings', path: '/settings' },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-[#2a3441] bg-[#111722]/95 backdrop-blur supports-[backdrop-filter]:bg-[#111722]/60">
            <div className="flex h-16 items-center px-6 gap-6">
                {/* Logo */}
                <div className="flex items-center gap-3 mr-4">
                    <img src="/logo-sigap.png" alt="Sigap AI" className="h-9 w-9 object-contain" />
                    <h1 className="text-xl font-bold tracking-tight text-white">Sigap AI</h1>
                </div>

                <div className="flex-1"></div>

                <div className="flex items-center gap-6">
                    {/* Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                className={({ isActive }) =>
                                    isActive
                                        ? 'px-4 py-2 text-sm font-medium text-primary border-b-2 border-primary transition-colors'
                                        : 'px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-[#2a3441] transition-colors'
                                }
                                end={item.path === '/'}
                            >
                                {item.name}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Right Section */}
                    <div className="flex items-center gap-4 border-l border-[#2a3441] pl-6">
                        {/* Notification Bell */}
                        <div ref={notifRef} className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative rounded-lg p-2 text-slate-400 hover:text-white hover:bg-[#2a3441] transition-colors"
                            >
                                <span className="material-symbols-outlined text-[24px]">notifications</span>
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {showNotifications && (
                                <div className="absolute right-0 top-12 w-[400px] bg-[#162032] border border-[#2a3649] rounded-xl shadow-2xl overflow-hidden z-[9999] animate-notif-slide">
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a3649]">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-base font-bold text-white">Notifications</h3>
                                            {unreadCount > 0 && (
                                                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                    {unreadCount} new
                                                </span>
                                            )}
                                        </div>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllRead}
                                                className="text-xs text-primary hover:text-blue-300 font-medium transition-colors"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>

                                    {/* List */}
                                    <div className="max-h-[380px] overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                                <span className="material-symbols-outlined text-[48px] mb-3 opacity-40">notifications_off</span>
                                                <p className="text-sm font-medium">No notifications</p>
                                                <p className="text-xs mt-1">You're all caught up!</p>
                                            </div>
                                        ) : (
                                            notifications.map((notif) => (
                                                <div
                                                    key={notif.id}
                                                    className={`group flex items-start gap-3 px-5 py-4 border-b border-[#2a3649]/50 hover:bg-[#1e293b] transition-colors cursor-pointer ${!notif.read ? 'bg-[#1a2540]' : ''
                                                        }`}
                                                    onClick={() => markAsRead(notif.id)}
                                                >
                                                    {/* Icon */}
                                                    <div className={`shrink-0 w-9 h-9 rounded-lg ${notif.iconBg} flex items-center justify-center mt-0.5`}>
                                                        <span className={`material-symbols-outlined text-[20px] ${notif.iconColor}`}>{notif.icon}</span>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className={`text-sm leading-tight ${!notif.read ? 'font-semibold text-white' : 'font-medium text-gray-300'}`}>
                                                                {notif.title}
                                                            </p>
                                                            {/* Dismiss */}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); dismissNotification(notif.id); }}
                                                                className="opacity-0 group-hover:opacity-100 shrink-0 text-gray-500 hover:text-red-400 transition-all"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">close</span>
                                                            </button>
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2">{notif.desc}</p>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <span className="text-[11px] text-gray-500">{notif.time}</span>
                                                            {!notif.read && (
                                                                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Footer */}
                                    {notifications.length > 0 && (
                                        <div className="px-5 py-3 border-t border-[#2a3649] bg-[#111c2e]">
                                            <Link
                                                to="/profile"
                                                onClick={() => setShowNotifications(false)}
                                                className="block text-center text-sm text-primary hover:text-blue-300 font-medium transition-colors"
                                            >
                                                View all notifications
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="h-8 w-[1px] bg-[#2a3441]"></div>

                        {/* User Profile */}
                        <Link to="/profile" className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-lg hover:bg-[#2a3441] transition-colors group">
                            <div
                                className="h-8 w-8 rounded-full bg-cover bg-center border border-[#2a3441]"
                                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAamexfWBjfdzds2MtWSqTwkCukLnT-w0srNbt9eMjWUraYEuGkTeEMjt4aCE89gbnjemlkKtbBBLY8A28hL1sd_T2rZ7iKEqCCVkN7Mk02U9Y4C496xQv9412oyZLwVohVXOJcDcAcy_d1wmD14po57RbkPUH86pZ7njJ-E4XoKwEdjN68vvyrLdFJR82FCfD3wXHcYMnpuBj2nh2fXv-RahBIlFbU2iTVyP6keyjuLOkWYGKgDrR1wvNLHlFgOuYBs7C-fbQrmzv2')" }}
                            ></div>
                            <div className="hidden lg:block text-left">
                                <p className="text-sm font-medium text-white group-hover:text-primary transition-colors">Ahmad Taufik Hayaza</p>
                                <p className="text-xs text-slate-400">Admin</p>
                            </div>
                            <span className="material-symbols-outlined text-slate-500 text-[20px]">expand_more</span>
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
