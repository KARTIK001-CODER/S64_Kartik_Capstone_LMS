import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, BookOpen, Users, BarChart3, MessageSquare, Bell, User, Settings, LogOut, X } from 'lucide-react';
import { AppContext } from '../../context/AppContext';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/educator' },
  { label: 'Add Course', icon: PlusCircle, to: '/educator/add-course' },
  { label: 'My Courses', icon: BookOpen, to: '/educator/my-courses' },
  { label: 'Students', icon: Users, to: '/educator/student-enrolled' },
  { label: 'Reports', icon: BarChart3, to: '/educator/reports' },
  { label: 'Reviews', icon: MessageSquare, to: '/educator/reviews' },
  { label: 'Notifications', icon: Bell, to: '/educator/notifications' },
  { label: 'Profile', icon: User, to: '/educator/profile' },
  { label: 'Settings', icon: Settings, to: '/educator/settings' },
];

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { logout } = useContext(AppContext);

  const sidebarContent = (
    <>
      <div className="px-3 pb-4 mb-2 border-b border-border flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Educator Portal</p>
        <button onClick={onClose} className="lg:hidden p-1 rounded text-muted-foreground hover:text-foreground transition-colors" aria-label="Close navigation menu">
          <X size={16} />
        </button>
      </div>
      <nav className="flex flex-col gap-0.5 flex-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to}
              onClick={onClose}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={() => { logout(); onClose(); }}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-error hover:bg-error/5 transition-colors mt-auto w-full text-left"
      >
        <LogOut size={18} />
        Log out
      </button>
    </>
  );

  return (
    <>
      <aside className="hidden lg:flex w-60 min-h-full bg-card border-r border-border py-6 px-3 flex-col gap-1 flex-shrink-0">
        {sidebarContent}
      </aside>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-card border-r border-border py-6 px-3 flex flex-col gap-1 shadow-xl animate-slide-up">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
