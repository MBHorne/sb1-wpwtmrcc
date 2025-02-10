import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Users, Link } from 'lucide-react';

const AdminLayout = () => {
  return (
    <div className="flex h-full">
      <div className="w-48 bg-gray-50 border-r">
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <NavLink
                to="/admin/users"
                className={({ isActive }) =>
                  `flex items-center p-2 rounded-lg ${
                    isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <Users className="w-4 h-4 mr-2" />
                Users
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/integration"
                className={({ isActive }) =>
                  `flex items-center p-2 rounded-lg ${
                    isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <Link className="w-4 h-4 mr-2" />
                Integration
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
      <div className="flex-1 p-6">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;