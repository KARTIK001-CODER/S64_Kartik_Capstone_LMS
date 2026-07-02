import React, { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import NavBar from '../../components/educator/NavBar';
import Sidebar from '../../components/educator/Sidebar';

const Educator = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="h-screen flex flex-col bg-muted/30">
      <NavBar onToggleSidebar={toggleSidebar} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <main className="flex-1 overflow-y-auto" onClick={closeSidebar}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Educator;
