import React, { useState } from 'react';

const Settings = () => {
    // Alert Thresholds state
    const [congestionThreshold, setCongestionThreshold] = useState(80);
    const [sensitivity, setSensitivity] = useState('LOW');

    // Notification toggles
    const [notifications, setNotifications] = useState({
        email: true,
        sms: true,
        push: true,
    });

    // Search
    const [searchQuery, setSearchQuery] = useState('');

    // Intersection data with editable state
    const [intersections, setIntersections] = useState([
        { id: 'INT-0042', name: '5th Ave & Market St', status: true, red: 15, green: 20, yellow: 5, editing: false },
        { id: 'INT-0078', name: 'Jl. Ahmad Yani & Jl. Raya', status: true, red: 20, green: 25, yellow: 5, editing: false },
        { id: 'INT-0103', name: 'Jl. Diponegoro & Jl. Pahlawan', status: true, red: 18, green: 22, yellow: 4, editing: false },
        { id: 'INT-0156', name: 'Jl. Basuki Rahmat & Jl. Urip', status: true, red: 15, green: 20, yellow: 5, editing: false },
        { id: 'INT-0201', name: 'Jl. Gubernur Suryo & Jl. Tunjungan', status: false, red: 12, green: 18, yellow: 3, editing: false },
        { id: 'INT-0245', name: 'Jl. Darmo & Jl. Mayjen Sungkono', status: true, red: 25, green: 30, yellow: 5, editing: false },
    ]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;

    const toggleNotification = (key) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleEditing = (idx) => {
        setIntersections(prev => prev.map((item, i) =>
            i === idx ? { ...item, editing: !item.editing } : item
        ));
    };

    const updateIntersection = (idx, field, value) => {
        setIntersections(prev => prev.map((item, i) =>
            i === idx ? { ...item, [field]: parseInt(value) || 0 } : item
        ));
    };

    const toggleIntersectionStatus = (idx) => {
        setIntersections(prev => prev.map((item, i) =>
            i === idx ? { ...item, status: !item.status } : item
        ));
    };

    // Filter and paginate
    const filtered = intersections.filter(item =>
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const sensitivityLevels = ['LOW', 'Medium', 'High'];

    const notificationChannels = [
        { key: 'email', label: 'Email Alerts', desc: 'Daily summary & critical events' },
        { key: 'sms', label: 'SMS Alerts', desc: 'Critical congestion only' },
        { key: 'push', label: 'Desktop Push', desc: 'Real-time browser popups' },
    ];

    return (
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 max-w-[1440px] mx-auto w-full">
            {/* Page Header */}
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-white mb-2">System Configuration</h1>
                <p className="text-gray-400 max-w-2xl">
                    Manage global traffic parameters, fine-tune intersection overdrives and configure your alert notification channels
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Alert Thresholds */}
                    <div className="bg-[#151e32] rounded-xl p-6 border border-gray-800">
                        <h2 className="text-lg font-semibold text-center text-white mb-6">Alert Thresholds</h2>

                        {/* Congestion Slider */}
                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-medium text-gray-300">Congestion Alert Capacity</span>
                                <span className="text-lg font-bold text-white">{congestionThreshold}%</span>
                            </div>
                            <div className="relative w-full h-2">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={congestionThreshold}
                                    onChange={(e) => setCongestionThreshold(parseInt(e.target.value))}
                                    className="w-full h-2 appearance-none cursor-pointer rounded-full"
                                    style={{
                                        background: `linear-gradient(to right, #1E88E5 0%, #1E88E5 ${congestionThreshold}%, #374151 ${congestionThreshold}%, #374151 100%)`,
                                    }}
                                />
                            </div>
                            <p className="mt-4 text-xs text-gray-400 leading-tight">
                                System triggers alerts when traffic density exceeds this percentage
                            </p>
                        </div>

                        {/* Incident Detection Sensitivity */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-300 mb-3">Incident Detection Sensitivity</h3>
                            <div className="flex bg-gray-800 p-1 rounded-lg">
                                {sensitivityLevels.map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setSensitivity(level)}
                                        className={`flex-1 text-xs font-semibold py-2 rounded transition-all ${sensitivity === level
                                                ? 'bg-primary text-white shadow-sm'
                                                : 'text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Notification Channels */}
                    <div className="bg-[#151e32] rounded-xl p-6 border border-gray-800">
                        <div className="flex items-center space-x-3 mb-6">
                            <span className="material-symbols-outlined text-gray-400 text-[28px]">notifications</span>
                            <h2 className="text-lg font-semibold text-white">Notification Channels</h2>
                        </div>
                        <div className="space-y-6">
                            {notificationChannels.map((channel) => (
                                <div key={channel.key} className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-sm font-bold text-white">{channel.label}</h3>
                                        <p className="text-xs text-gray-400">{channel.desc}</p>
                                    </div>
                                    <button
                                        onClick={() => toggleNotification(channel.key)}
                                        className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${notifications[channel.key] ? 'bg-primary' : 'bg-gray-700'
                                            }`}
                                    >
                                        <span
                                            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${notifications[channel.key] ? 'right-0.5' : 'left-0.5'
                                                }`}
                                        ></span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Intersection Overdrives */}
                <div className="lg:col-span-8">
                    <div className="bg-[#151e32] rounded-xl border border-gray-800 flex flex-col">
                        {/* Table Header */}
                        <div className="p-6 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">Intersection Overdrives</h2>
                                <p className="text-sm text-gray-400 mt-1">Manual timing constraints for specific signals</p>
                            </div>
                            <div className="relative w-full sm:w-72">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-gray-400">search</span>
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search intersections..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-lg bg-transparent text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm transition"
                                />
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-primary text-white text-xs font-bold uppercase tracking-wider">
                                        <th className="px-6 py-4">Intersection</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-center">Red Light (s)</th>
                                        <th className="px-6 py-4 text-center">Green Light (s)</th>
                                        <th className="px-6 py-4 text-center">Yellow Light (s)</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800 text-sm">
                                    {paginated.map((item, idx) => {
                                        const realIdx = (currentPage - 1) * itemsPerPage + idx;
                                        return (
                                            <tr key={item.id + idx} className="hover:bg-gray-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-white">{item.name}</div>
                                                    <div className="text-xs text-gray-400 mt-0.5">ID:{item.id}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => toggleIntersectionStatus(realIdx)}
                                                        className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold transition-colors ${item.status
                                                                ? 'bg-green-400 text-gray-900'
                                                                : 'bg-red-400/20 text-red-400'
                                                            }`}
                                                    >
                                                        {item.status ? 'ON' : 'OFF'}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {item.editing ? (
                                                        <input
                                                            type="number"
                                                            value={item.red}
                                                            onChange={(e) => updateIntersection(realIdx, 'red', e.target.value)}
                                                            className="w-16 bg-gray-700 border border-gray-500 rounded px-2 py-1.5 text-center text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                        />
                                                    ) : (
                                                        <div className="bg-gray-700/50 rounded px-3 py-2 text-gray-200 font-medium inline-block min-w-[3rem]">{item.red}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {item.editing ? (
                                                        <input
                                                            type="number"
                                                            value={item.green}
                                                            onChange={(e) => updateIntersection(realIdx, 'green', e.target.value)}
                                                            className="w-16 bg-gray-700 border border-gray-500 rounded px-2 py-1.5 text-center text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                        />
                                                    ) : (
                                                        <div className="bg-gray-700/50 rounded px-3 py-2 text-gray-200 font-medium inline-block min-w-[3rem]">{item.green}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {item.editing ? (
                                                        <input
                                                            type="number"
                                                            value={item.yellow}
                                                            onChange={(e) => updateIntersection(realIdx, 'yellow', e.target.value)}
                                                            className="w-16 bg-gray-700 border border-gray-500 rounded px-2 py-1.5 text-center text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                        />
                                                    ) : (
                                                        <div className="bg-gray-700/50 rounded px-3 py-2 text-gray-200 font-medium inline-block min-w-[3rem]">{item.yellow}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => toggleEditing(realIdx)}
                                                        className={`p-2 rounded-lg border transition-colors ${item.editing
                                                                ? 'border-primary text-primary bg-primary/10 hover:bg-primary/20'
                                                                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                                                            }`}
                                                    >
                                                        <span className="material-symbols-outlined text-xl">
                                                            {item.editing ? 'check' : 'edit'}
                                                        </span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="p-6 mt-auto border-t border-gray-800 flex justify-between items-center">
                            <span className="text-sm text-gray-400">
                                Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} intersections
                            </span>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined text-sm">arrow_back_ios</span>
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
