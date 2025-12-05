import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import Sidebar from '../Sidebar';

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 transition-all duration-300 ease-in-out">
        <Outlet />
      </main>
    </div>
  );
}

// Inserir item no menu lateral
<li>
  <NavLink
    to="/admin/ordens-servico"
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`
    }
  >
    <span className="font-medium">Ordens de Serviço</span>
  </NavLink>
</li>
