import React from 'react';
import { Outlet } from 'react-router-dom';

const MobileLayout = () => {
  return (
    <div className="app-container" style={{ width: '100%', height: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, position: 'relative' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default MobileLayout;
