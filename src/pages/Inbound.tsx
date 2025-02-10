import React, { useState, useEffect } from 'react';
import { Plus, Package, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logActivity } from '../lib/activity';

interface InboundProps {
  clientFilter?: string;
}

interface InboundPackage {
  id: string;
  client_id: string;
  package_type: string;
  received_by: string;
  atera_ticket_id: string;
  status: 'OK' | 'WARNING' | 'CRITICAL';
  received_date: string;
  expected_date: string;
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  serial_number?: string;
  client: {
    name: string;
  };
}

interface FilterState {
  showCompleted: boolean;
  client: string;
  packageType: string;
  serialNumber: string;
  receivedBy: string;
  status: string;
}

interface FormData {
  client_id: string;
  package_type: string;
  received_by: string;
  atera_ticket_id: string;
  expected_date: string;
  serial_number?: string;
}

const PACKAGE_TYPES = [
  'Desktop Computer',
  'Laptop',
  'Server',
  'Network Equipment',
  'Printer',
  'Other'
];

const Inbound: React.FC<InboundProps> = ({ clientFilter }) => {
  const [packages, setPackages] = useState<InboundPackage[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    showCompleted: false,
    client: '',
    packageType: '',
    serialNumber: '',
    receivedBy: '',
    status: ''
  });
  const [clients, setClients] = useState<{ id: string; name: string; }[]>([]);
  const [formData, setFormData] = useState<FormData>({
    client_id: '',
    package_type: '',
    received_by: '',
    atera_ticket_id: '',
    expected_date: new Date().toISOString().split('T')[0]
  });
  const [stats, setStats] = useState({
    ok: 0,
    warning: 0,
    critical: 0
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<InboundPackage>>({});

  const calculateStatus = (expectedDate: string): 'OK' | 'WARNING' | 'CRITICAL' => {
    const expected = new Date(expectedDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - expected.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Count only workdays (Monday to Friday)
    let workdays = 0;
    const tempDate = new Date(expected);
    while (tempDate <= today) {
      const day = tempDate.getDay();
      if (day !== 0 && day !== 6) { // 0 = Sunday, 6 = Saturday
        workdays++;
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }

    if (workdays <= 3) return 'OK';
    if (workdays <= 5) return 'WARNING';
    return 'CRITICAL';
  };

  const fetchPackages = async () => {
    let query = supabase
      .from('inbound_packages')
      .select(`
        *,
        client:clients(name)
      `)
      .order('expected_date', { ascending: false });

    if (clientFilter) {
      query = query.eq('client_id', clientFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching packages:', error);
      return;
    }

    const packagesWithStatus = data?.map(pkg => ({
      ...pkg,
      status: calculateStatus(pkg.expected_date)
    })) || [];

    // Apply all filters
    let filteredPackages = filters.showCompleted 
      ? packagesWithStatus
      : packagesWithStatus.filter(pkg => !pkg.completed);

    if (filters.client && !clientFilter) {
      filteredPackages = filteredPackages.filter(pkg => 
        pkg.client.name.toLowerCase().includes(filters.client.toLowerCase())
      );
    }

    if (filters.packageType) {
      filteredPackages = filteredPackages.filter(pkg => 
        pkg.package_type.toLowerCase().includes(filters.packageType.toLowerCase())
      );
    }

    if (filters.serialNumber) {
      filteredPackages = filteredPackages.filter(pkg => 
        pkg.serial_number?.toLowerCase().includes(filters.serialNumber.toLowerCase())
      );
    }

    if (filters.receivedBy) {
      filteredPackages = filteredPackages.filter(pkg => 
        pkg.received_by.toLowerCase().includes(filters.receivedBy.toLowerCase())
      );
    }

    if (filters.status) {
      filteredPackages = filteredPackages.filter(pkg => 
        pkg.status.toLowerCase() === filters.status.toLowerCase()
      );
    }

    // Calculate statistics from filtered packages
    const stats = filteredPackages.reduce((acc, pkg) => {
      acc[pkg.status.toLowerCase() as 'ok' | 'warning' | 'critical']++;
      return acc;
    }, { ok: 0, warning: 0, critical: 0 });

    setStats(stats);
    setPackages(filteredPackages);
  };

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Error fetching clients:', error);
      return;
    }

    setClients(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const packageData = {
      ...formData,
      client_id: clientFilter || formData.client_id,
      received_date: new Date().toISOString()
    };

    const { data: newPackage, error } = await supabase
      .from('inbound_packages')
      .insert([packageData])
      .select(`
        *,
        client:clients(name)
      `)
      .single();

    if (error) {
      console.error('Error creating package:', error);
      return;
    }

    if (newPackage) {
      await logActivity(
        'CREATE',
        'INBOUND_PACKAGE',
        newPackage.id,
        `Created new inbound package: ${newPackage.package_type} for ${newPackage.client.name}`
      );
    }

    setShowAddModal(false);
    setFormData({
      client_id: '',
      package_type: '',
      received_by: '',
      atera_ticket_id: '',
      expected_date: new Date().toISOString().split('T')[0]
    });
    fetchPackages();
  };

  const handleEdit = async (id: string) => {
    if (!editData.package_type && !editData.received_by && !editData.atera_ticket_id && !editData.serial_number) {
      setEditingId(null);
      return;
    }

    const { error } = await supabase
      .from('inbound_packages')
      .update(editData)
      .eq('id', id);

    if (error) {
      console.error('Error updating package:', error);
      return;
    }

    if (id) {
      await logActivity(
        'UPDATE',
        'INBOUND_PACKAGE',
        id,
        `Updated inbound package details`
      );
    }

    setEditingId(null);
    setEditData({});
    fetchPackages();
  };

  const handleComplete = async (id: string) => {
    const { data: completedPackage, error } = await supabase
      .from('inbound_packages')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        completed_by: (await supabase.auth.getUser()).data.user?.email
      })
      .eq('id', id)
      .select(`
        *,
        client:clients(name)
      `)
      .single();

    if (error) {
      console.error('Error completing package:', error);
      return;
    }

    if (completedPackage) {
      await logActivity(
        'UPDATE',
        'INBOUND_PACKAGE',
        completedPackage.id,
        `Completed inbound package: ${completedPackage.package_type} for ${completedPackage.client.name}`
      );
    }

    fetchPackages();
  };

  useEffect(() => {
    fetchPackages();
    fetchClients();
  }, [filters]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">
          {clientFilter ? 'Client Inbound Packages' : 'Inbound Packages'}
        </h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.showCompleted}
              onChange={(e) => setFilters(prev => ({ ...prev, showCompleted: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Show Completed</span>
          </label>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-5 h-5" />
            Add New Package
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">OK</p>
              <p className="text-2xl font-bold text-green-600">{stats.ok}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Warning</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.warning}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical</p>
              <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex flex-col gap-2">
                Status
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="mt-1 text-xs border-gray-300 rounded-md"
                  >
                    <option value="">All</option>
                    <option value="OK">OK</option>
                    <option value="WARNING">Warning</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </th>
              {!clientFilter && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex flex-col gap-2">
                Client
                  <input
                    type="text"
                    value={filters.client}
                    onChange={(e) => setFilters(prev => ({ ...prev, client: e.target.value }))}
                    placeholder="Filter clients..."
                    className="mt-1 text-xs border-gray-300 rounded-md"
                  />
                </div>
              </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex flex-col gap-2">
                Package Type
                  <input
                    type="text"
                    value={filters.packageType}
                    onChange={(e) => setFilters(prev => ({ ...prev, packageType: e.target.value }))}
                    placeholder="Filter types..."
                    className="mt-1 text-xs border-gray-300 rounded-md"
                  />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex flex-col gap-2">
                  Serial Number
                  <input
                    type="text"
                    value={filters.serialNumber}
                    onChange={(e) => setFilters(prev => ({ ...prev, serialNumber: e.target.value }))}
                    placeholder="Filter serial numbers..."
                    className="mt-1 text-xs border-gray-300 rounded-md"
                  />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex flex-col gap-2">
                Received By
                  <input
                    type="text"
                    value={filters.receivedBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, receivedBy: e.target.value }))}
                    placeholder="Filter receivers..."
                    className="mt-1 text-xs border-gray-300 rounded-md"
                  />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expected Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Atera Ticket
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {packages.map((pkg) => {
              const statusColors = {
                OK: 'bg-green-100 text-green-800',
                WARNING: 'bg-yellow-100 text-yellow-800',
                CRITICAL: 'bg-red-100 text-red-800'
              };

              const rowColors = {
                OK: '',
                WARNING: 'bg-yellow-50',
                CRITICAL: 'bg-red-50'
              };
              
              return (
                <tr key={pkg.id} className={rowColors[pkg.status]}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[pkg.status]}`}>
                      {pkg.status}
                    </span>
                  </td>
                  {!clientFilter && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-medium">{pkg.client.name}</span>
                  </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === pkg.id ? (
                      <input
                        type="text"
                        value={editData.package_type || pkg.package_type}
                        onChange={(e) => setEditData(prev => ({ ...prev, package_type: e.target.value }))}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      />
                    ) : (
                      pkg.package_type
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === pkg.id ? (
                      <input
                        type="text"
                        value={editData.serial_number || pkg.serial_number || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, serial_number: e.target.value }))}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        placeholder="Enter serial number"
                      />
                    ) : (
                      pkg.serial_number || 'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === pkg.id ? (
                      <input
                        type="text"
                        value={editData.received_by || pkg.received_by}
                        onChange={(e) => setEditData(prev => ({ ...prev, received_by: e.target.value }))}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      />
                    ) : (
                      pkg.received_by
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(pkg.expected_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === pkg.id ? (
                      <input
                        type="text"
                        value={editData.atera_ticket_id || pkg.atera_ticket_id || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, atera_ticket_id: e.target.value }))}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        placeholder="Enter ticket ID"
                      />
                    ) : (
                      pkg.atera_ticket_id || 'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      {pkg.completed ? (
                        <div className="text-green-600 flex items-center gap-1">
                          <span className="text-xs">Completed {new Date(pkg.completed_at!).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-500">by {pkg.completed_by}</span>
                        </div>
                      ) : (
                        <>
                          {editingId === pkg.id ? (
                            <button
                              onClick={() => handleEdit(pkg.id)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              Save
                            </button>
                          ) : (
                            <button
                              onClick={() => handleComplete(pkg.id)}
                              className="text-green-600 hover:text-green-700 text-sm font-medium"
                            >
                              Mark Complete
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (editingId === pkg.id) {
                                setEditingId(null);
                                setEditData({});
                              } else {
                                setEditingId(pkg.id);
                              }
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            {editingId === pkg.id ? 'Cancel' : 'Edit'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {/* Add Package Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Package</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Client</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Package Type</label>
                <select
                  value={formData.package_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, package_type: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a type</option>
                  {PACKAGE_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Received By</label>
                <input
                  type="text"
                  value={formData.received_by}
                  onChange={(e) => setFormData(prev => ({ ...prev, received_by: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Expected Date</label>
                <input
                  type="date"
                  value={formData.expected_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, expected_date: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Atera Ticket ID</label>
                <input
                  type="text"
                  value={formData.atera_ticket_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, atera_ticket_id: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                <input
                  type="text"
                  value={formData.serial_number || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Add Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inbound