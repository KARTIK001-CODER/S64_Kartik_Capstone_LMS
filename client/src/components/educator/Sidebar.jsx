import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, BookOpen, Users, BarChart3, LogOut } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/educator/dashboard' },
  { label: 'Add Course', icon: PlusCircle, to: '/educator/add-course' },
  { label: 'My Courses', icon: BookOpen, to: '/educator/my-courses' },
  { label: 'Students', icon: Users, to: '/educator/student-enrolled' },
  { label: 'Reports', icon: BarChart3, to: '/educator/reports' },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-60 min-h-full bg-card border-r border-border py-6 px-3 flex flex-col gap-1 flex-shrink-0">
      <div className="px-3 pb-4 mb-2 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Educator Portal</p>
      </div>
      <nav className="flex flex-col gap-0.5 flex-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to}
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
      <Link
        to="/login"
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-error hover:bg-error/5 transition-colors mt-auto"
      >
        <LogOut size={18} />
        Log out
      </Link>
    </aside>
  );
};

export default Sidebar;
