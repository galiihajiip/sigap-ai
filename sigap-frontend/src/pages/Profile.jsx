import React, { useState, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';

const Profile = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Profile photo state
    const [profilePhoto, setProfilePhoto] = useState(
        'https://lh3.googleusercontent.com/aida-public/AB6AXuALIGvCUCSF-pzNYDx-UEYMJMPh6Dr2S2AFH_ee9cd1duFB6cgl25Wd7xZ3O2YUpCqiyrzem0TEJiHfqXErVJR-KUnFvOg6wW3DRa5EXC6bJq1jjdVeMgKT_wwb_5G98jFkxiD1yk1fandighAfr5Ex3Hh6Lr0P_CRTh0GbW8bxUsCydMyoudmOtojFt7-T2XUWw3HA7Ggr-yTcnwrDjDRYkr9h4Ng1S06bhFgRxKjbKSrfBWx-0VWiGxYg47fcXq9f-AMJqNHOFVah'
    );

    // Sidebar navigation
    const [activeSection, setActiveSection] = useState('profil');

    // Form state
    const [formData, setFormData] = useState({
        gender: 'male',
        firstName: '',
        lastName: '',
        email: 'Agungsah90@gmail.com',
        phone: '',
        dob: '',
        language: '',
        timezone: '',
    });

    // Password change state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // Notification settings
    const [notifSettings, setNotifSettings] = useState({
        emailNotif: true,
        pushNotif: true,
        smsNotif: false,
        congestionAlerts: true,
        incidentAlerts: true,
        systemUpdates: false,
    });

    // Edit mode
    const [isEditing, setIsEditing] = useState(false);

    // Success message
    const [successMessage, setSuccessMessage] = useState('');

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setProfilePhoto(ev.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleFormChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePasswordChange = (field, value) => {
        setPasswordData(prev => ({ ...prev, [field]: value }));
    };

    const toggleNotif = (key) => {
        setNotifSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsEditing(false);
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        setSuccessMessage('Password updated successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const handleNotifSubmit = (e) => {
        e.preventDefault();
        setSuccessMessage('Notification preferences saved!');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const sidebarItems = [
        {
            key: 'akun',
            icon: 'person',
            label: 'Akun Saya',
            children: [
                { key: 'profil', label: 'Profil' },
                { key: 'password', label: 'Ubah Password' },
            ],
        },
        { key: 'notifikasi', icon: 'notifications', label: 'Notifikasi' },
    ];

    return (
        <div className="h-screen flex flex-col bg-background-dark font-display overflow-hidden">
            {/* Profile Header */}
            <header className="bg-[#111827] border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0 z-50">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 group"
                >
                    <span className="material-symbols-outlined text-white group-hover:text-primary transition-colors">arrow_back_ios</span>
                    <span className="text-xl font-semibold text-white group-hover:text-primary transition-colors">Back</span>
                </button>
                <nav className="hidden md:flex items-center space-x-8">
                    <NavLink to="/" className="text-gray-400 font-medium hover:text-primary transition-colors">Dashboard</NavLink>
                    <NavLink to="/analytics" className="text-gray-400 font-medium hover:text-primary transition-colors">Analytics</NavLink>
                    <NavLink to="/livemap" className="text-gray-400 font-medium hover:text-primary transition-colors">Live Map</NavLink>
                    <NavLink to="/settings" className="text-gray-400 font-medium hover:text-primary transition-colors">Settings</NavLink>
                </nav>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside className="w-72 bg-[#111827] border-r border-gray-800 shrink-0 p-6 lg:p-8 space-y-8 overflow-y-auto hidden lg:block">
                    {/* User avatar + name */}
                    <div className="flex items-center space-x-4 mb-8">
                        <img
                            alt="Profile"
                            className="w-12 h-12 rounded-full object-cover border-2 border-primary"
                            src={profilePhoto}
                        />
                        <div>
                            <h3 className="font-bold text-white leading-tight">Agung Hapsah</h3>
                            <p className="text-xs text-gray-400">ID 98392018210991</p>
                        </div>
                    </div>

                    {/* Sidebar nav */}
                    <nav className="space-y-6">
                        {sidebarItems.map((item) => (
                            <div key={item.key}>
                                <button
                                    onClick={() => {
                                        if (item.children) {
                                            setActiveSection(item.children[0].key);
                                        } else {
                                            setActiveSection(item.key);
                                        }
                                    }}
                                    className={`flex items-center gap-4 w-full text-left font-semibold transition-colors ${(item.children && item.children.some(c => c.key === activeSection)) || activeSection === item.key
                                            ? 'text-primary'
                                            : 'text-gray-300 hover:text-primary'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                                    <span className="text-lg">{item.label}</span>
                                </button>
                                {item.children && (
                                    <div className="ml-10 mt-3 space-y-3">
                                        {item.children.map((child) => (
                                            <button
                                                key={child.key}
                                                onClick={() => setActiveSection(child.key)}
                                                className={`block text-base transition-colors ${activeSection === child.key
                                                        ? 'text-primary font-medium'
                                                        : 'text-gray-400 hover:text-primary'
                                                    }`}
                                            >
                                                {child.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
                    {/* Success Banner */}
                    {successMessage && (
                        <div className="mb-6 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 animate-pulse">
                            <span className="material-symbols-outlined text-[20px]">check_circle</span>
                            {successMessage}
                        </div>
                    )}

                    {/* Profile Section */}
                    {activeSection === 'profil' && (
                        <div className="flex flex-col xl:flex-row gap-6">
                            {/* Profile Card */}
                            <div className="w-full xl:w-1/3 bg-[#162032] rounded-2xl p-8 flex flex-col items-center justify-center text-center border border-gray-700 min-h-[400px]">
                                <div className="relative mb-6">
                                    <div className="w-40 h-40 rounded-full p-1 bg-gradient-to-tr from-gray-700 to-gray-600">
                                        <img
                                            alt="Profile"
                                            className="w-full h-full rounded-full object-cover border-4 border-[#162032]"
                                            src={profilePhoto}
                                        />
                                    </div>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-2 right-2 bg-primary hover:bg-[#1670c9] text-white p-2 rounded-lg shadow-lg transition-colors flex items-center justify-center w-10 h-10 border-2 border-[#162032]"
                                    >
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                    />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-1">Agung Hapsah</h2>
                                <p className="text-sm text-gray-400">ID 98392018210991</p>
                            </div>

                            {/* Personal Info Form */}
                            <div className="w-full xl:w-2/3 bg-[#162032] rounded-2xl p-8 border border-gray-700">
                                <h2 className="text-xl font-bold text-white mb-6">Personal Information</h2>
                                <form onSubmit={handleSubmit}>
                                    {/* Gender */}
                                    <div className="flex items-center gap-6 mb-8">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="radio"
                                                name="gender"
                                                value="male"
                                                checked={formData.gender === 'male'}
                                                onChange={() => handleFormChange('gender', 'male')}
                                                disabled={!isEditing}
                                                className="w-5 h-5 text-primary border-gray-600 focus:ring-primary bg-transparent"
                                            />
                                            <span className="text-sm font-medium text-gray-300 group-hover:text-primary transition-colors">Male</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="radio"
                                                name="gender"
                                                value="female"
                                                checked={formData.gender === 'female'}
                                                onChange={() => handleFormChange('gender', 'female')}
                                                disabled={!isEditing}
                                                className="w-5 h-5 text-primary border-gray-600 focus:ring-primary bg-transparent"
                                            />
                                            <span className="text-sm font-medium text-gray-300 group-hover:text-primary transition-colors">Female</span>
                                        </label>
                                    </div>

                                    {/* Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 mb-8">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-300">First Name</label>
                                            <input
                                                type="text"
                                                value={formData.firstName}
                                                onChange={(e) => handleFormChange('firstName', e.target.value)}
                                                disabled={!isEditing}
                                                placeholder="First Name"
                                                className="w-full rounded-xl border-none bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary shadow-sm disabled:opacity-60"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-300">Last Name</label>
                                            <input
                                                type="text"
                                                value={formData.lastName}
                                                onChange={(e) => handleFormChange('lastName', e.target.value)}
                                                disabled={!isEditing}
                                                placeholder="Last Name"
                                                className="w-full rounded-xl border-none bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary shadow-sm disabled:opacity-60"
                                            />
                                        </div>
                                        <div className="col-span-1 md:col-span-2 space-y-2">
                                            <label className="block text-sm font-medium text-gray-300">Email</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleFormChange('email', e.target.value)}
                                                disabled={!isEditing}
                                                className="w-full rounded-xl border-none bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary shadow-sm disabled:opacity-60"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-300">Phone Number</label>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => handleFormChange('phone', e.target.value)}
                                                disabled={!isEditing}
                                                placeholder="Number"
                                                className="w-full rounded-xl border-none bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary shadow-sm disabled:opacity-60"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-300">Date of Birth</label>
                                            <input
                                                type="date"
                                                value={formData.dob}
                                                onChange={(e) => handleFormChange('dob', e.target.value)}
                                                disabled={!isEditing}
                                                className="w-full rounded-xl border-none bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary shadow-sm disabled:opacity-60"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-300">Language Preference</label>
                                            <input
                                                type="text"
                                                value={formData.language}
                                                onChange={(e) => handleFormChange('language', e.target.value)}
                                                disabled={!isEditing}
                                                placeholder="Language"
                                                className="w-full rounded-xl border-none bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary shadow-sm disabled:opacity-60"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-300">Time Zone</label>
                                            <input
                                                type="text"
                                                value={formData.timezone}
                                                onChange={(e) => handleFormChange('timezone', e.target.value)}
                                                disabled={!isEditing}
                                                placeholder="Time Zone"
                                                className="w-full rounded-xl border-none bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary shadow-sm disabled:opacity-60"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-8">
                                        {isEditing ? (
                                            <div className="flex gap-4">
                                                <button
                                                    type="submit"
                                                    className="flex-1 bg-primary hover:bg-[#1670c9] text-white font-semibold py-3.5 px-6 rounded-xl transition-colors shadow-lg shadow-blue-500/30"
                                                >
                                                    Save Changes
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditing(false)}
                                                    className="px-6 py-3.5 rounded-xl border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 font-semibold transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setIsEditing(true)}
                                                className="w-full bg-primary hover:bg-[#1670c9] text-white font-semibold py-3.5 px-6 rounded-xl transition-colors shadow-lg shadow-blue-500/30"
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Change Password Section */}
                    {activeSection === 'password' && (
                        <div className="max-w-xl mx-auto">
                            <div className="bg-[#162032] rounded-2xl p-8 border border-gray-700">
                                <h2 className="text-xl font-bold text-white mb-6">Change Password</h2>
                                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-300">Current Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                                            placeholder="Enter current password"
                                            className="w-full rounded-xl border-none bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-300">New Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                            placeholder="Enter new password"
                                            className="w-full rounded-xl border-none bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-300">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                            placeholder="Confirm new password"
                                            className="w-full rounded-xl border-none bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary shadow-sm"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-primary hover:bg-[#1670c9] text-white font-semibold py-3.5 px-6 rounded-xl transition-colors shadow-lg shadow-blue-500/30 mt-4"
                                    >
                                        Update Password
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Notification Settings Section */}
                    {activeSection === 'notifikasi' && (
                        <div className="max-w-xl mx-auto">
                            <div className="bg-[#162032] rounded-2xl p-8 border border-gray-700">
                                <h2 className="text-xl font-bold text-white mb-2">Notification Preferences</h2>
                                <p className="text-gray-400 text-sm mb-8">Choose how you want to receive alerts and updates</p>
                                <form onSubmit={handleNotifSubmit} className="space-y-8">
                                    {/* Delivery Methods */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Delivery Methods</h3>
                                        <div className="space-y-4">
                                            {[
                                                { key: 'emailNotif', label: 'Email Notifications', desc: 'Receive alerts via email' },
                                                { key: 'pushNotif', label: 'Push Notifications', desc: 'Browser push alerts' },
                                                { key: 'smsNotif', label: 'SMS Notifications', desc: 'Text message alerts' },
                                            ].map((item) => (
                                                <div key={item.key} className="flex justify-between items-center p-3 rounded-lg hover:bg-[#1e293b] transition-colors">
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{item.label}</p>
                                                        <p className="text-xs text-gray-400">{item.desc}</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleNotif(item.key)}
                                                        className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${notifSettings[item.key] ? 'bg-primary' : 'bg-gray-700'
                                                            }`}
                                                    >
                                                        <span
                                                            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${notifSettings[item.key] ? 'right-0.5' : 'left-0.5'
                                                                }`}
                                                        ></span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Alert Types */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Alert Types</h3>
                                        <div className="space-y-4">
                                            {[
                                                { key: 'congestionAlerts', label: 'Congestion Alerts', desc: 'Traffic density warnings' },
                                                { key: 'incidentAlerts', label: 'Incident Alerts', desc: 'Accident and road hazards' },
                                                { key: 'systemUpdates', label: 'System Updates', desc: 'Maintenance and version updates' },
                                            ].map((item) => (
                                                <div key={item.key} className="flex justify-between items-center p-3 rounded-lg hover:bg-[#1e293b] transition-colors">
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{item.label}</p>
                                                        <p className="text-xs text-gray-400">{item.desc}</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleNotif(item.key)}
                                                        className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${notifSettings[item.key] ? 'bg-primary' : 'bg-gray-700'
                                                            }`}
                                                    >
                                                        <span
                                                            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${notifSettings[item.key] ? 'right-0.5' : 'left-0.5'
                                                                }`}
                                                        ></span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-primary hover:bg-[#1670c9] text-white font-semibold py-3.5 px-6 rounded-xl transition-colors shadow-lg shadow-blue-500/30"
                                    >
                                        Save Preferences
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Profile;
