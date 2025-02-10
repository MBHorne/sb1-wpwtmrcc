import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Clients from '../pages/Clients';
import Inbound from '../pages/Inbound';
import ClientDashboard from '../pages/ClientDashboard';
import Assets from '../pages/Assets';
import Applications from '../pages/Applications';
import NetworkDocs from '../pages/NetworkDocs';
import Printers from '../pages/Printers';
import ClientInbound from '../pages/ClientInbound';
import AdminLayout from './AdminLayout';
import Users from '../pages/admin/Users';
import Integration from '../pages/admin/Integration';
import NotFound from '../pages/NotFound';

const MainContent = () => {
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/:clientId" element={<ClientDashboard />} />
        <Route path="/inbound" element={<Inbound />} />
        <Route path="/clients/:clientId/network" element={<NetworkDocs />} />
        <Route path="/clients/:clientId/assets" element={<Assets />} />
        <Route path="/clients/:clientId/applications" element={<Applications />} />
        <Route path="/clients/:clientId/printers" element={<Printers />} />
        <Route path="/clients/:clientId/m365/inbound" element={<ClientInbound />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Users />} />
          <Route path="users" element={<Users />} />
          <Route path="integration" element={<Integration />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default MainContent;