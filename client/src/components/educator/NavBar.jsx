import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, LayoutDashboard } from 'lucide-react';
import logoSrc from '../../assets/logo.svg';
import { AppContext } from '../../context/AppContext';
import { Avatar } from '../ui/avatar';
import { Button } from '../ui/button';
import ThemeToggle from '../ui/ThemeToggle';
import NotificationDropdown from '../student/NotificationDropdown';

const NavBar = ({ onToggleSidebar }) => {
  const { user } = useContext(AppContext);
  const navigate = useNavigate();
  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <nav className="h-16 border-b border-border bg-card px-4 md:px-8 flex items-center justify-between flex-shrink-0 z-40 relative">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>
        <Link to="/educator" className="flex items-center gap-2 hover:opacity-80 transition">
          <img src={logoSrc} alt="Learnova" className="h-7 w-auto" />
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <NotificationDropdown />
        <ThemeToggle />
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} aria-label="Switch to student view">
          <LayoutDashboard size={14} />
          Student View
        </Button>
        <div className="flex items-center gap-3 pl-3 border-l border-border">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground">{user?.name || 'Educator'}</p>
            <p className="text-xs text-muted-foreground">Educator</p>
          </div>
          <Avatar size="sm" alt={user?.name} initials={initials} />
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
