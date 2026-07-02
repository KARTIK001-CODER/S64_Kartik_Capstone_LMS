import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard } from 'lucide-react';
import logoSrc from '../../assets/logo.svg';
import { AppContext } from '../../context/AppContext';
import { Avatar } from '../ui/avatar';
import { Button } from '../ui/button';
import ThemeToggle from '../ui/ThemeToggle';

const NavBar = () => {
  const { user } = useContext(AppContext);
  const navigate = useNavigate();

  return (
    <nav className="h-16 border-b border-border bg-card px-4 md:px-8 flex items-center justify-between flex-shrink-0">
      <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
        <img src={logoSrc} alt="Learnova" className="h-7 w-auto" />
      </Link>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <LayoutDashboard size={14} />
          Student View
        </Button>
        <div className="flex items-center gap-3 pl-3 border-l border-border">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{user?.name || 'Educator'}</p>
            <p className="text-xs text-muted-foreground">Educator</p>
          </div>
          <Avatar size="sm" alt={user?.name} />
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
