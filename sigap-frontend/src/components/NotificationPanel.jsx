import React, { useRef, useEffect } from 'react';
import { X, CheckCheck, Trash2, Eye, AlertTriangle, Info, CheckCircle2, AlertCircle, Bell } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

// -------------------------------------------------------
// Helper: relative time
// -------------------------------------------------------
const timeAgo = (isoString) => {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
};

// -------------------------------------------------------
// Type config
// -------------------------------------------------------
const TYPE_CONFIG = {
  critical: {
    icon: AlertCircle,
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    iconColor: 'text-red-400',
    dot: 'bg-red-500',
    label: 'Critical',
    labelBg: 'bg-red-500/20 text-red-400',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    iconColor: 'text-amber-400',
    dot: 'bg-amber-500',
    label: 'Warning',
    labelBg: 'bg-amber-500/20 text-amber-400',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    iconColor: 'text-blue-400',
    dot: 'bg-blue-500',
    label: 'Info',
    labelBg: 'bg-blue-500/20 text-blue-400',
  },
  success: {
    icon: CheckCircle2,
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    iconColor: 'text-emerald-400',
    dot: 'bg-emerald-500',
    label: 'Success',
    labelBg: 'bg-emerald-500/20 text-emerald-400',
  },
};

// -------------------------------------------------------
// Single notification card
// -------------------------------------------------------
const NotificationCard = ({ notification, onRead, onDelete }) => {
  const cfg = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info;
  const Icon = cfg.icon;

  return (
    <div
      className={`relative rounded-xl border transition-all duration-200 ${
        notification.isRead
          ? 'bg-[#161b26]/60 border-[#2a3441]/50 opacity-60 hover:opacity-90'
          : `${cfg.bg} ${cfg.border}`
      }`}
    >
      {/* Unread dot */}
      {!notification.isRead && (
        <span className={`absolute top-3 right-3 h-2 w-2 rounded-full ${cfg.dot}`} />
      )}

      <div className="p-3">
        {/* Type + time */}
        <div className="flex items-center gap-1.5 mb-1.5 pr-5">
          <Icon size={13} className={cfg.iconColor} />
          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${cfg.labelBg}`}>
            {cfg.label}
          </span>
          <span className="ml-auto text-[9px] text-slate-500 font-mono flex-shrink-0">
            {timeAgo(notification.timestamp)}
          </span>
        </div>

        {/* Title */}
        <h4 className={`text-xs font-bold mb-0.5 leading-snug ${notification.isRead ? 'text-slate-400' : 'text-white'}`}>
          {notification.title}
        </h4>

        {/* Message */}
        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
          {notification.message}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#2a3441]/50">
          {!notification.isRead && (
            <button
              onClick={(e) => { e.stopPropagation(); onRead(notification.id); }}
              className="flex items-center gap-1 text-[10px] font-medium text-slate-500 hover:text-blue-400
                         bg-[#2a3441]/40 hover:bg-blue-500/10 px-2 py-1 rounded-md transition-all duration-150"
            >
              <Eye size={10} /> Read
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
            className="flex items-center gap-1 text-[10px] font-medium text-slate-500 hover:text-red-400
                       bg-[#2a3441]/40 hover:bg-red-500/10 px-2 py-1 rounded-md transition-all duration-150 ml-auto"
          >
            <Trash2 size={10} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------
// Main dropdown panel
// -------------------------------------------------------
const NotificationPanel = () => {
  const {
    notifications,
    isPanelOpen,
    unreadCount,
    closePanel,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotifications();

  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!panelRef.current?.contains(e.target)) {
        if (e.target.closest('[data-notification-bell]')) return;
        closePanel();
      }
    };
    if (isPanelOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPanelOpen, closePanel]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') closePanel(); };
    if (isPanelOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isPanelOpen, closePanel]);

  if (!isPanelOpen) return null;

  return (
    <>
      {/* Transparent overlay to catch outside clicks */}
      <div className="fixed inset-0 z-[55]" />

      {/* Dropdown panel — below header (top-16 = 64px) */}
      <div
        ref={panelRef}
        className="fixed top-16 right-4 z-[60] w-[360px] max-w-[calc(100vw-2rem)] flex flex-col
                   rounded-2xl border border-[#2a3441]
                   bg-[#111722]/95 backdrop-blur-xl
                   shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)]"
        style={{ animation: 'dropDown 0.22s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Arrow pointer to bell */}
        <div
          className="absolute -top-[7px] right-[18px] w-3 h-3 rotate-45
                     bg-[#1e2433] border-l border-t border-[#2a3441]"
        />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#2a3441] rounded-t-2xl bg-[#161b26]/70">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#135bec]/10 rounded-lg border border-[#135bec]/20">
              <Bell size={15} className="text-[#135bec]" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm leading-none">Notifications</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {unreadCount > 0 ? (
                  <><span className="text-[#135bec] font-semibold">{unreadCount}</span> belum dibaca</>
                ) : 'Semua sudah dibaca'}
              </p>
            </div>
          </div>
          <button
            onClick={closePanel}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-[#2a3441] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Bulk actions */}
        {notifications.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[#2a3441]/60 bg-[#161b26]/30">
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-all
                         text-slate-400 hover:text-emerald-400 bg-[#2a3441]/40 hover:bg-emerald-500/10
                         disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <CheckCheck size={12} /> Read All
            </button>
            <button
              onClick={deleteAllNotifications}
              className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-all
                         text-slate-400 hover:text-red-400 bg-[#2a3441]/40 hover:bg-red-500/10"
            >
              <Trash2 size={12} /> Delete All
            </button>
            <span className="ml-auto text-[9px] text-slate-600 font-mono">
              {notifications.length} total
            </span>
          </div>
        )}

        {/* Notification list with max height */}
        <div
          className="overflow-y-auto p-3 space-y-2 notif-scroll"
          style={{ maxHeight: 'min(420px, calc(100vh - 140px))' }}
        >
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="p-3 bg-[#2a3441]/30 rounded-xl mb-3">
                <Bell size={28} className="text-slate-600" />
              </div>
              <p className="text-slate-500 font-medium text-xs">Tidak ada notifikasi</p>
              <p className="text-slate-600 text-[10px] mt-0.5">Semua sudah bersih!</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <NotificationCard
                key={notif.id}
                notification={notif}
                onRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[#2a3441]/60 rounded-b-2xl bg-[#161b26]/40">
          <p className="text-[9px] text-slate-600 text-center font-mono tracking-wider">
            Sigap AI • Notification Center
          </p>
        </div>
      </div>

      <style>{`
        @keyframes dropDown {
          from { opacity: 0; transform: translateY(-10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        .notif-scroll::-webkit-scrollbar { width: 4px; }
        .notif-scroll::-webkit-scrollbar-track { background: transparent; }
        .notif-scroll::-webkit-scrollbar-thumb { background: #2a3441; border-radius: 4px; }
        .notif-scroll::-webkit-scrollbar-thumb:hover { background: #374354; }
      `}</style>
    </>
  );
};

export default NotificationPanel;
