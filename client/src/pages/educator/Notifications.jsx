import React, { useState } from 'react';
import { Bell, Clock, UserPlus, Star, CheckCircle, ArrowLeft, MessageSquare } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/empty-state';

const TYPE_ICONS = {
  enrollment: UserPlus,
  review: Star,
  completion: CheckCircle,
  system: MessageSquare,
};

const TYPE_COLORS = {
  enrollment: 'text-blue-500 bg-blue-500/10',
  review: 'text-amber-500 bg-amber-500/10',
  completion: 'text-green-500 bg-green-500/10',
  system: 'text-muted-foreground bg-muted',
};

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const Notifications = () => {
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useAppContext();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'No unread notifications'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllNotificationsRead}>
            <CheckCircle size={14} /> Mark all as read
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === 'unread' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          description={filter === 'unread' ? 'You have read all your notifications.' : 'Notifications will appear here when something important happens.'}
        />
      ) : (
        <Card variant="default" padding="none">
          <div className="divide-y divide-border">
            {filtered.map((notification) => {
              const Icon = TYPE_ICONS[notification.type] || Bell;
              const colorClass = TYPE_COLORS[notification.type] || TYPE_COLORS.system;
              return (
                <div
                  key={notification._id}
                  onClick={() => !notification.isRead && markNotificationRead(notification._id)}
                  onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !notification.isRead) { e.preventDefault(); markNotificationRead(notification._id); } }}
                  role="button"
                  tabIndex={0}
                  aria-label={notification.title}
                  className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                    !notification.isRead ? 'bg-primary/[0.02] cursor-pointer hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring' : 'hover:bg-accent/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg flex-shrink-0 ${colorClass}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`text-sm font-medium ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground/60">
                      <Clock size={11} />
                      {formatTimestamp(notification.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Notifications;
