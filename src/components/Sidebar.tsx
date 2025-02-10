import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Package, ChevronDown, Network, Printer, Box, AppWindow, Microscope as Microsoft, Receipt, Settings } from 'lucide-react';
import { useClientStore } from '../store/clientStore';

const Sidebar = () => {
  const location = useLocation();
  const { selectedClientId, selectedClientName } = useClientStore();
  const isInAdminSection = location.pathname.startsWith('/admin');

  return (
    <div className="w-64 bg-white h-full shadow-lg flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-gray-800">MSP Manager</h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto">
        <ul className="p-2 space-y-2">
          <li>
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center p-2 rounded-lg ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <LayoutDashboard className="w-5 h-5 mr-3" />
              Dashboard
            </NavLink>
          </li>
          
          <li>
            <NavLink
              to="/clients"
              className={({ isActive }) =>
                `flex items-center p-2 rounded-lg ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <Users className="w-5 h-5 mr-3" />
              Clients
            </NavLink>
          </li>

          {selectedClientId && (
            <li className="ml-4 mt-2">
              <NavLink
                to={`/clients/${selectedClientId}`}
                className={({ isActive }) =>
                  `block text-sm font-semibold mb-2 ${
                    isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`
                }
              >
                {selectedClientName} - Documentation
              </NavLink>
              <ul className="space-y-1">
                <li>
                  <NavLink
                    to={`/clients/${selectedClientId}/network`}
                    className={({ isActive }) =>
                      `flex items-center p-2 text-sm rounded-lg ${
                        isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <Network className="w-4 h-4 mr-2" />
                    Network
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to={`/clients/${selectedClientId}/printers`}
                    className={({ isActive }) =>
                      `flex items-center p-2 text-sm rounded-lg ${
                        isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Printers
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to={`/clients/${selectedClientId}/assets`}
                    className={({ isActive }) =>
                      `flex items-center p-2 text-sm rounded-lg ${
                        isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <Box className="w-4 h-4 mr-2" />
                    Assets
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to={`/clients/${selectedClientId}/applications`}
                    className={({ isActive }) =>
                      `flex items-center p-2 text-sm rounded-lg ${
                        isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <AppWindow className="w-4 h-4 mr-2" />
                    Applications
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to={`/clients/${selectedClientId}/m365`}
                    end
                    className={({ isActive }) =>
                      `flex items-center p-2 text-sm rounded-lg ${
                        isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <Microsoft className="w-4 h-4 mr-2" />
                    M365
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to={`/clients/${selectedClientId}/m365/inbound`}
                    end
                    className={({ isActive }) =>
                      `flex items-center p-2 text-sm rounded-lg ${
                        isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Inbound
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to={`/clients/${selectedClientId}/billing`}
                    className={({ isActive }) =>
                      `flex items-center p-2 text-sm rounded-lg ${
                        isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <Receipt className="w-4 h-4 mr-2" />
                    Billing
                  </NavLink>
                </li>
              </ul>
            </li>
          )}
          
          <li>
            <NavLink
              to="/inbound"
              className={({ isActive }) =>
                `flex items-center p-2 rounded-lg ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <Package className="w-5 h-5 mr-3" />
              Inbound
            </NavLink>
          </li>
        </ul>
      </nav>
      
      <div className="mt-auto border-t">
        <NavLink
          to="/admin"
          className={({ isActive }) =>
            `flex items-center p-4 ${
              isInAdminSection ? 'text-blue-600' : 'text-gray-700 hover:text-gray-900'
            }`
          }
        >
          <Settings className="w-5 h-5 mr-3" />
          Admin
        </NavLink>
      </div>
    </div>
  );
}

export default Sidebar;