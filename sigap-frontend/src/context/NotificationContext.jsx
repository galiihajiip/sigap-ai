import React, { createContext, useContext, useState, useCallback } from 'react';

// -------------------------------------------------------
// Sample notifications (dummy data for demo)
// -------------------------------------------------------
const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    type: 'critical',       // critical | warning | info | success
    title: 'Kemacetan Parah — Jl. Thamrin',
    message: 'Antrian kendaraan >500m. Sistem merekomendasikan pembukaan jalur contra-flow segera.',
    location: 'JKT-001',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: 'notif-2',
    type: 'warning',
    title: 'Hujan Lebat Diprediksi — Pontianak',
    message: 'Curah hujan akan meningkat dalam 30 menit. Tambahan delay +7 menit diprediksi.',
    location: 'PTK-001',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: 'notif-3',
    type: 'info',
    title: 'AI Adjustment Applied — Jl. Soedirman',
    message: 'Signal timing berhasil diubah dari 45s menjadi 65s. Monitoring dampak dalam 10 menit.',
    location: 'SBY-001',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: 'notif-4',
    type: 'success',
    title: 'Kemacetan Berkurang — Jl. Asia Afrika',
    message: 'Flow kendaraan kembali normal. Congestion risk turun dari 45% ke 28%.',
    location: 'BDG-001',
    timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    isRead: true,
  },
  {
    id: 'notif-5',
    type: 'warning',
    title: 'Volume Kendaraan Tinggi — Medan',
    message: 'Flow kendaraan 30% di atas normal. Koordinasi sinyal perlu disesuaikan.',
    location: 'MDN-001',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    isRead: true,
  },
  {
    id: 'notif-6',
    type: 'critical',
    title: 'Kamera Offline — Cam 3 Thamrin',
    message: 'Kamera Cam 3 – Thamrin Bundaran tidak merespons. Perlu pengecekan teknis.',
    location: 'JKT-001',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    isRead: false,
  },
];

// -------------------------------------------------------
// Context
// -------------------------------------------------------
const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const togglePanel = useCallback(() => {
    setIsPanelOpen((prev) => !prev);
  }, []);

  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const deleteNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const deleteAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        isPanelOpen,
        unreadCount,
        togglePanel,
        closePanel,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
