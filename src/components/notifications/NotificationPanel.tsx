'use client';

import { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, Info, Shield } from 'lucide-react';
import DirectiveModal from './DirectiveModal';

interface Notification {
    id: string;
    type: 'directive' | 'alert' | 'system' | 'stewardship';
    severity: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
    directive_data?: any;
    affected_regions?: string[];
    created_at: string;
    read_by?: string[];
}

export default function NotificationPanel() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId })
            });
            fetchNotifications(); // Refresh
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical':
                return <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />;
            case 'warning':
                return <Shield size={18} className="text-yellow-500 flex-shrink-0" />;
            default:
                return <Info size={18} className="text-blue-500 flex-shrink-0" />;
        }
    };

    return (
        <>
            {/* Notification Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Notifications"
            >
                <Bell size={20} className="text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 top-14 w-96 bg-gray-900 border border-gray-800 rounded-lg shadow-2xl max-h-[600px] overflow-hidden flex flex-col z-50">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                        <h3 className="font-semibold text-white">Notifications</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-400 hover:text-white transition"
                            aria-label="Close notifications"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto flex-1">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-800">
                                {notifications.map(notification => {
                                    const isRead = notification.read_by && notification.read_by.length > 0;
                                    return (
                                        <button
                                            key={notification.id}
                                            onClick={() => {
                                                setSelectedNotification(notification);
                                                markAsRead(notification.id);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full p-4 text-left hover:bg-gray-800/50 transition-colors ${isRead ? 'opacity-60' : 'bg-gray-800/20'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                {getSeverityIcon(notification.severity)}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="font-medium text-sm text-white line-clamp-2">
                                                            {notification.title}
                                                        </p>
                                                        {!isRead && (
                                                            <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-1"></span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-xs text-gray-500">
                                                            {new Date(notification.created_at).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                        {notification.type === 'directive' && (
                                                            <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                                                                Autonomous Directive
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Full Notification Modal */}
            {selectedNotification && (
                <DirectiveModal
                    notification={selectedNotification}
                    onClose={() => setSelectedNotification(null)}
                />
            )}
        </>
    );
}
