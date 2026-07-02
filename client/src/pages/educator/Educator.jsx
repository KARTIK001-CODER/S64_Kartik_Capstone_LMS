import React from 'react';
import { Outlet } from 'react-router-dom';
import NavBar from '../../components/educator/NavBar';
import Sidebar from '../../components/educator/Sidebar';

const Educator = () => {
  return (
    <div className="h-screen flex flex-col bg-muted/30">
      <NavBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Educator;
