import React from 'react';
import { Bell, ChevronDown, Map, LayoutDashboard, LineChart, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'DashBoard', icon: LayoutDashboard, path: '/' },
  { label: 'Analytics', icon: LineChart, path: '/analytics' },
  { label: 'Live Map', icon: Map, path: '/live-map' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

const Header = () => {
    const location = useLocation();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-[#2a3441] bg-[#111722]/95 backdrop-blur supports-[backdrop-filter]:bg-[#111722]/60">
            <div className="flex h-16 items-center px-6 gap-6">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-3 mr-4">
                    <div className="w-8 h-8 text-[#135bec]">
                        <svg className="h-full w-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                            <path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z" fill="currentColor" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-white">Sigap AI</h1>
                </Link>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Nav + Actions */}
                <div className="flex items-center gap-6">
                    {/* Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const active = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                        active
                                            ? 'text-[#135bec] border-b-2 border-[#135bec] rounded-none'
                                            : 'text-slate-400 hover:text-white hover:bg-[#2a3441]'
                                    }`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4 border-l border-[#2a3441] pl-6">
                        {/* Notification Bell */}
                        <button className="relative rounded-lg p-2 text-slate-400 hover:text-white hover:bg-[#2a3441] transition-colors">
                            <Bell size={24} />
                            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
                        </button>

                        <div className="h-8 w-[1px] bg-[#2a3441]" />

                        {/* User Profile */}
                        <button className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-lg hover:bg-[#2a3441] transition-colors group">
                            <div
                                className="h-8 w-8 rounded-full bg-cover bg-center border border-[#2a3441]"
                                style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAamexfWBjfdzds2MtWSqTwkCukLnT-w0srNbt9eMjWUraYEuGkTeEMjt4aCE89gbnjemlkKtbBBLY8A28hL1sd_T2rZ7iKEqCCVkN7Mk02U9Y4C496xQv9412oyZLwVohVXOJcDcAcy_d1wmD14po57RbkPUH86pZ7njJ-E4XoKwEdjN68vvyrLdFJR82FCfD3wXHcYMnpuBj2nh2fXv-RahBIlFbU2iTVyP6keyjuLOkWYGKgDrR1wvNLHlFgOuYBs7C-fbQrmzv2')` }}
                            />
                            <div className="hidden lg:block text-left">
                                <p className="text-sm font-medium text-white group-hover:text-[#135bec] transition-colors">Alex Morgan</p>
                                <p className="text-xs text-slate-400">Admin</p>
                            </div>
                            <ChevronDown size={20} className="text-slate-500" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
