import React, { useState } from 'react';
import {
  User, Bell, Lock, Camera, ChevronRight,
  Save, Eye, EyeOff, Globe, Clock, Phone,
  Calendar, Mail, ShieldCheck, LogOut,
} from 'lucide-react';

// -------------------------------------------------------
// Sidebar nav items
// -------------------------------------------------------
const SIDEBAR_SECTIONS = [
  {
    label: 'Akun Saya',
    icon: User,
    items: [
      { id: 'profil',   label: 'Profil' },
      { id: 'password', label: 'Ubah Password' },
    ],
  },
  {
    label: 'Notifikasi',
    icon: Bell,
    items: [
      { id: 'notifikasi', label: 'Preferensi Notifikasi' },
    ],
  },
];

// -------------------------------------------------------
// Dummy user data
// -------------------------------------------------------
const DEFAULT_USER = {
  name: 'Agung Hapsah',
  id: '98392018210991',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAamexfWBjfdzds2MtWSqTwkCukLnT-w0srNbt9eMjWUraYEuGkTeEMjt4aCE89gbnjemlkKtbBBLY8A28hL1sd_T2rZ7iKEqCCVkN7Mk02U9Y4C496xQv9412oyZLwVohVXOJcDcAcy_d1wmD14po57RbkPUH86pZ7njJ-E4XoKwEdjN68vvyrLdFJR82FCfD3wXHcYMnpuBj2nh2fXv-RahBIlFbU2iTVyP6keyjuLOkWYGKgDrR1wvNLHlFgOuYBs7C-fbQrmzv2',
  gender: 'female',
  firstName: 'Agung',
  lastName: 'Hapsah',
  email: 'Agungsah90@gmail.com',
  phone: '',
  dob: '',
  language: 'Bahasa Indonesia',
  timezone: 'WIB (UTC+7)',
};

// -------------------------------------------------------
// Input field component
// -------------------------------------------------------
const Field = ({ label, icon: Icon, type = 'text', placeholder, value, onChange, disabled }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
          <Icon size={15} />
        </span>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 rounded-xl text-sm
          bg-[#161b26] border border-[#2a3441] text-white placeholder:text-slate-600
          focus:outline-none focus:border-[#135bec] focus:ring-1 focus:ring-[#135bec]/40
          disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200`}
      />
    </div>
  </div>
);

// -------------------------------------------------------
// Profil Tab
// -------------------------------------------------------
const ProfilTab = ({ user, onSave }) => {
  const [form, setForm]       = useState({ ...user });
  const [editing, setEditing] = useState(false);
  const [saved, setSaved]     = useState(false);

  const handleChange = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSave = () => {
    onSave(form);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Profile card */}
      <div className="flex-shrink-0 w-full lg:w-52">
        <div className="bg-[#1e2433] border border-[#2a3441] rounded-2xl p-6 flex flex-col items-center gap-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 bg-[#135bec]/5 pointer-events-none" />
          <div className="relative">
            <img
              src={form.avatar}
              alt="avatar"
              className="w-24 h-24 rounded-full object-cover border-2 border-[#135bec]/50 shadow-lg shadow-[#135bec]/20"
            />
            {editing && (
              <button className="absolute bottom-0 right-0 p-1.5 bg-[#135bec] rounded-full text-white shadow-lg hover:bg-[#0e4bce] transition-colors">
                <Camera size={14} />
              </button>
            )}
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-base">{form.firstName} {form.lastName}</p>
            <p className="text-slate-500 text-xs mt-0.5">ID {user.id}</p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#135bec]/15 text-[#135bec] border border-[#135bec]/20">
            Admin
          </span>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 bg-[#1e2433] border border-[#2a3441] rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white font-bold text-lg">Personal Information</h3>
            <p className="text-slate-500 text-xs mt-0.5">Kelola informasi profil kamu</p>
          </div>
          {saved && (
            <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
              <ShieldCheck size={13} /> Tersimpan
            </span>
          )}
        </div>

        {/* Gender */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Gender</p>
          <div className="flex gap-6">
            {['male', 'female'].map((g) => (
              <label key={g} className="flex items-center gap-2 cursor-pointer group">
                <div
                  onClick={() => editing && setForm((p) => ({ ...p, gender: g }))}
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
                    ${form.gender === g ? 'border-[#135bec] bg-[#135bec]' : 'border-[#2a3441] group-hover:border-slate-400'}`}
                >
                  {form.gender === g && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className="text-sm text-slate-300 capitalize">{g === 'male' ? 'Male' : 'Female'}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Name row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field label="First Name" placeholder="First Name" value={form.firstName} onChange={handleChange('firstName')} disabled={!editing} />
          <Field label="Last Name"  placeholder="Last Name"  value={form.lastName}  onChange={handleChange('lastName')}  disabled={!editing} />
        </div>

        {/* Email */}
        <div className="mb-4">
          <Field label="Email" icon={Mail} type="email" placeholder="Email address" value={form.email} onChange={handleChange('email')} disabled={!editing} />
        </div>

        {/* Phone + DOB */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field label="Phone Number"  icon={Phone}    type="tel"  placeholder="Number" value={form.phone} onChange={handleChange('phone')} disabled={!editing} />
          <Field label="Date of Birth" icon={Calendar} type="date" placeholder="Birth"  value={form.dob}   onChange={handleChange('dob')}   disabled={!editing} />
        </div>

        {/* Language + Timezone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Language Preference</label>
            <div className="relative">
              <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <select
                value={form.language}
                onChange={handleChange('language')}
                disabled={!editing}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-[#161b26] border border-[#2a3441] text-white
                  focus:outline-none focus:border-[#135bec] disabled:opacity-50 disabled:cursor-not-allowed transition-all appearance-none"
              >
                {['Bahasa Indonesia', 'English', 'Melayu'].map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Time Zone</label>
            <div className="relative">
              <Clock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <select
                value={form.timezone}
                onChange={handleChange('timezone')}
                disabled={!editing}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-[#161b26] border border-[#2a3441] text-white
                  focus:outline-none focus:border-[#135bec] disabled:opacity-50 disabled:cursor-not-allowed transition-all appearance-none"
              >
                {['WIB (UTC+7)', 'WITA (UTC+8)', 'WIT (UTC+9)'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="w-full py-3 rounded-xl font-bold text-sm bg-[#135bec] hover:bg-[#0e4bce] text-white
              shadow-lg shadow-[#135bec]/25 transition-all duration-200 hover:shadow-[#135bec]/40 hover:-translate-y-0.5"
          >
            Edit
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => { setForm({ ...user }); setEditing(false); }}
              className="flex-1 py-3 rounded-xl font-bold text-sm bg-[#2a3441] hover:bg-[#374354] text-slate-300 transition-all duration-200"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 rounded-xl font-bold text-sm bg-[#135bec] hover:bg-[#0e4bce] text-white
                shadow-lg shadow-[#135bec]/25 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Save size={16} /> Simpan
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// -------------------------------------------------------
// Password Tab
// -------------------------------------------------------
const PasswordTab = () => {
  const [show, setShow] = useState({ current: false, newPw: false, confirm: false });
  const [form, setForm] = useState({ current: '', newPw: '', confirm: '' });
  const [saved, setSaved] = useState(false);

  const toggle = (k) => setShow((p) => ({ ...p, [k]: !p[k] }));
  const handleChange = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = () => {
    if (!form.current || !form.newPw || form.newPw !== form.confirm) return;
    setForm({ current: '', newPw: '', confirm: '' });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const PwField = ({ label, fKey }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type={show[fKey] ? 'text' : 'password'}
          placeholder="••••••••"
          value={form[fKey]}
          onChange={handleChange(fKey)}
          className="w-full pl-10 pr-11 py-3 rounded-xl text-sm bg-[#161b26] border border-[#2a3441] text-white
            placeholder:text-slate-600 focus:outline-none focus:border-[#135bec] focus:ring-1 focus:ring-[#135bec]/40 transition-all"
        />
        <button
          type="button"
          onClick={() => toggle(fKey)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
        >
          {show[fKey] ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-lg">
      <div className="bg-[#1e2433] border border-[#2a3441] rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white font-bold text-lg">Ubah Password</h3>
            <p className="text-slate-500 text-xs mt-0.5">Pastikan password baru kuat dan unik</p>
          </div>
          {saved && (
            <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
              <ShieldCheck size={13} /> Berhasil
            </span>
          )}
        </div>

        <div className="space-y-4 mb-7">
          <PwField label="Password Saat Ini"       fKey="current" />
          <PwField label="Password Baru"            fKey="newPw"   />
          <PwField label="Konfirmasi Password Baru" fKey="confirm" />
        </div>

        {form.newPw && form.confirm && form.newPw !== form.confirm && (
          <p className="text-red-400 text-xs mb-4">Password tidak cocok</p>
        )}

        <button
          onClick={handleSave}
          disabled={!form.current || !form.newPw || form.newPw !== form.confirm}
          className="w-full py-3 rounded-xl font-bold text-sm bg-[#135bec] hover:bg-[#0e4bce] text-white
            shadow-lg shadow-[#135bec]/25 transition-all duration-200 hover:-translate-y-0.5
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          Ubah Password
        </button>
      </div>
    </div>
  );
};

// -------------------------------------------------------
// Notifikasi Tab
// -------------------------------------------------------
const NOTIF_OPTIONS = [
  { key: 'critical', label: 'Alert Kemacetan Kritis',   desc: 'Notifikasi saat congestion risk >80%' },
  { key: 'warning',  label: 'Peringatan Cuaca',          desc: 'Hujan lebat, angin kencang, dll.' },
  { key: 'ai',       label: 'Rekomendasi AI',            desc: 'Saat sistem AI memberikan rekomendasi baru' },
  { key: 'camera',   label: 'Status Kamera CCTV',        desc: 'Kamera offline atau gangguan sinyal' },
  { key: 'system',   label: 'Update Sistem',             desc: 'Pemeliharaan dan pengumuman platform' },
];

const NotifikasiTab = () => {
  const [prefs, setPrefs] = useState({ critical: true, warning: true, ai: true, camera: false, system: false });
  const [saved, setSaved] = useState(false);

  const toggle = (k) => setPrefs((p) => ({ ...p, [k]: !p[k] }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-lg">
      <div className="bg-[#1e2433] border border-[#2a3441] rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white font-bold text-lg">Preferensi Notifikasi</h3>
            <p className="text-slate-500 text-xs mt-0.5">Pilih jenis notifikasi yang ingin kamu terima</p>
          </div>
          {saved && (
            <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
              <ShieldCheck size={13} /> Tersimpan
            </span>
          )}
        </div>

        <div className="space-y-3 mb-7">
          {NOTIF_OPTIONS.map(({ key, label, desc }) => (
            <div
              key={key}
              onClick={() => toggle(key)}
              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200
                ${prefs[key] ? 'bg-[#135bec]/8 border-[#135bec]/20' : 'bg-[#161b26] border-[#2a3441] hover:border-[#374354]'}`}
            >
              <div>
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
              <div
                className={`flex-shrink-0 w-11 h-6 rounded-full relative transition-all duration-300 ml-4
                  ${prefs[key] ? 'bg-[#135bec]' : 'bg-[#2a3441]'}`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300
                    ${prefs[key] ? 'left-6' : 'left-1'}`}
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 rounded-xl font-bold text-sm bg-[#135bec] hover:bg-[#0e4bce] text-white
            shadow-lg shadow-[#135bec]/25 transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5"
        >
          <Save size={16} /> Simpan Preferensi
        </button>
      </div>
    </div>
  );
};

// -------------------------------------------------------
// Main SettingsPage
// -------------------------------------------------------
const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profil');
  const [user, setUser] = useState({ ...DEFAULT_USER });

  const renderContent = () => {
    if (activeTab === 'profil')     return <ProfilTab user={user} onSave={(u) => setUser(u)} />;
    if (activeTab === 'password')   return <PasswordTab />;
    if (activeTab === 'notifikasi') return <NotifikasiTab />;
    return null;
  };

  return (
    <main className="flex-1 p-6 lg:p-8 max-w-[1400px] mx-auto w-full">
      {/* Page header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-1">Settings</h2>
        <p className="text-slate-400 text-sm">Kelola akun dan preferensi sistem kamu</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="lg:w-56 flex-shrink-0">
          <div className="bg-[#1e2433] border border-[#2a3441] rounded-2xl overflow-hidden shadow-lg">
            {/* User mini card */}
            <div className="p-5 flex items-center gap-3 border-b border-[#2a3441] bg-[#161b26]/60">
              <img
                src={user.avatar}
                alt="avatar"
                className="w-10 h-10 rounded-full object-cover border border-[#2a3441]"
              />
              <div className="min-w-0">
                <p className="text-white text-sm font-bold truncate">{user.firstName} {user.lastName}</p>
                <p className="text-slate-500 text-[10px] truncate">ID {user.id}</p>
              </div>
            </div>

            {/* Nav */}
            <div className="p-3 space-y-1">
              {SIDEBAR_SECTIONS.map((section) => (
                <div key={section.label}>
                  <div className="flex items-center gap-2 px-3 py-2 mt-2 mb-1">
                    <section.icon size={14} className="text-[#135bec]" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[#135bec]">
                      {section.label}
                    </span>
                  </div>
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                        ${activeTab === item.id
                          ? 'bg-[#135bec]/15 text-[#135bec] border border-[#135bec]/20'
                          : 'text-slate-400 hover:text-white hover:bg-[#2a3441]'}`}
                    >
                      {item.label}
                      {activeTab === item.id && <ChevronRight size={14} />}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Logout */}
            <div className="p-3 border-t border-[#2a3441]">
              <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200">
                <LogOut size={15} />
                Keluar
              </button>
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {renderContent()}
        </div>
      </div>
    </main>
  );
};

export default SettingsPage;
