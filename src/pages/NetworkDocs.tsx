import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Network as NetworkIcon, Plus, X, Trash2, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logActivity } from '../lib/activity';
import { useClientStore } from '../store/clientStore';

interface Subnet {
  id: string;
  subnet_address: string;
  gateway: string;
  dns: string[];
  dhcp_range: string;
  vlan: number;
}

interface Network {
  id: string;
  name: string;
  network_type: 'LAN' | 'WAN';
  description: string;
  subnets: Subnet[];
}

const NetworkDocs = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [networks, setNetworks] = useState<Network[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [activeTab, setActiveTab] = useState<'LAN' | 'WAN'>('LAN');
  const [formData, setFormData] = useState<Omit<Network, 'id'> & { subnets: Omit<Subnet, 'id'>[] }>({
    name: '',
    network_type: 'LAN',
    description: '',
    subnets: [{
      subnet_address: '',
      gateway: '',
      dns: [''],
      dhcp_range: '',
      vlan: 1
    }]
  });

  const fetchNetworks = async () => {
    const { data, error } = await supabase
      .from('networks')
      .select(`
        *,
        subnets(*)
      `)
      .eq('client_id', clientId)
      .eq('network_type', activeTab);

    if (error) {
      console.error('Error fetching networks:', error);
      return;
    }

    setNetworks(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (showEditModal && selectedNetwork) {
      // Update existing network
      const { error: networkError } = await supabase
        .from('networks')
        .update({
          name: formData.name,
          description: formData.description
        })
        .eq('id', selectedNetwork.id);

      if (networkError) {
        console.error('Error updating network:', networkError);
        return;
      }

      // Delete existing subnets
      const { error: deleteError } = await supabase
        .from('subnets')
        .delete()
        .eq('network_id', selectedNetwork.id);

      if (deleteError) {
        console.error('Error deleting existing subnets:', deleteError);
        return;
      }

      // Insert updated subnets
      const { error: subnetError } = await supabase
        .from('subnets')
        .insert(formData.subnets.map(subnet => ({
          ...subnet,
          network_id: selectedNetwork.id
        })));

      if (subnetError) {
        console.error('Error creating subnets:', subnetError);
        return;
      }

      if (selectedNetwork) {
        await logActivity(
          'UPDATE',
          'NETWORK',
          selectedNetwork.id,
          `Updated network: ${selectedNetwork.name}`
        );
      }

      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedNetwork(null);
      resetForm();
      fetchNetworks();
      resetForm();
    } else {
      // Create new network
      const { data: networkData, error: networkError } = await supabase
        .from('networks')
        .insert([{
          client_id: clientId,
          network_type: activeTab,
          name: formData.name,
          description: formData.description
        }])
        .select()
        .single();

      if (networkError) {
        console.error('Error creating network:', networkError);
        return;
      }

      if (networkData) {
        await logActivity(
          'CREATE',
          'NETWORK',
          networkData.id,
          `Created new network: ${networkData.name}`
        );
      }

      if (!networkData) {
        console.error('No network data returned after creation');
        return;
      }

      // Insert new subnets
      const { error: subnetError } = await supabase
        .from('subnets')
        .insert(formData.subnets.map(subnet => ({
          ...subnet,
          network_id: networkData.id
        })));

      if (subnetError) {
        console.error('Error creating subnets:', subnetError);
        return;
      }

      setShowAddModal(false);
      setSelectedNetwork(null);
      resetForm();
      fetchNetworks();
    }
  };

  const handleEdit = (network: Network) => {
    setSelectedNetwork(network);
    setFormData({
      name: network.name,
      network_type: network.network_type,
      description: network.description || '',
      subnets: network.subnets.map(subnet => ({
        subnet_address: subnet.subnet_address,
        gateway: subnet.gateway || '',
        dns: subnet.dns || [''],
        dhcp_range: subnet.dhcp_range || '',
        vlan: subnet.vlan || 1
      }))
    });
    setShowEditModal(true);
  };

  const handleDelete = async (network: Network) => {
    const { data, error } = await supabase
      .from('networks')
      .delete()
      .eq('id', network.id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting network:', error);
      return;
    }

    if (data) {
      await logActivity(
        'DELETE',
        'NETWORK',
        data.id,
        `Deleted network: ${data.name}`
      );
    }

    setShowDeleteModal(false);
    setSelectedNetwork(null);
    fetchNetworks();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      network_type: activeTab,
      description: '',
      subnets: [{
        subnet_address: '',
        gateway: '',
        dns: [''],
        dhcp_range: '',
        vlan: 1
      }]
    });
  };

  useEffect(() => {
    if (clientId) {
      fetchNetworks();
    }
  }, [clientId, activeTab]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Network Documentation</h1>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-5 h-5" />
          Add New Network
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex space-x-4 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('LAN')}
              className={`py-4 px-2 text-sm font-medium border-b-2 ${
                activeTab === 'LAN'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              LAN
            </button>
            <button
              onClick={() => setActiveTab('WAN')}
              className={`py-4 px-2 text-sm font-medium border-b-2 ${
                activeTab === 'WAN'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              WAN
            </button>
          </nav>
        </div>

        <div className="p-6">
          {networks.length === 0 ? (
            <div className="text-center py-12">
              <NetworkIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No networks</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new network.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {networks.map((network) => (
                <div key={network.id} className="border rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {network.name}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(network)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedNetwork(network);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  {network.description && (
                    <p className="text-gray-600 mb-4">{network.description}</p>
                  )}
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-500">Subnets</h4>
                    {network.subnets?.map((subnet) => (
                      <div key={subnet.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Subnet Address</p>
                            <p className="font-medium">{subnet.subnet_address}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Gateway</p>
                            <p className="font-medium">{subnet.gateway}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">DNS Servers</p>
                            <p className="font-medium">{subnet.dns.join(', ')}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">DHCP Range</p>
                            <p className="font-medium">{subnet.dhcp_range}</p>
                          </div>
                          {subnet.vlan && (
                            <div>
                              <p className="text-sm text-gray-500">VLAN</p>
                              <p className="font-medium">{subnet.vlan}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Add Network Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center overflow-y-auto">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {showEditModal ? 'Edit Network' : 'Add New Network'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setSelectedNetwork(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Network Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Subnets</h4>
                {formData.subnets.map((subnet, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Subnet Address</label>
                        <input
                          type="text"
                          value={subnet.subnet_address}
                          onChange={(e) => {
                            const newSubnets = [...formData.subnets];
                            newSubnets[index].subnet_address = e.target.value;
                            setFormData(prev => ({ ...prev, subnets: newSubnets }));
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Gateway</label>
                        <input
                          type="text"
                          value={subnet.gateway}
                          onChange={(e) => {
                            const newSubnets = [...formData.subnets];
                            newSubnets[index].gateway = e.target.value;
                            setFormData(prev => ({ ...prev, subnets: newSubnets }));
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">DNS Servers</label>
                        <input
                          type="text"
                          value={subnet.dns.join(', ')}
                          onChange={(e) => {
                            const newSubnets = [...formData.subnets];
                            newSubnets[index].dns = e.target.value.split(',').map(s => s.trim());
                            setFormData(prev => ({ ...prev, subnets: newSubnets }));
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="8.8.8.8, 8.8.4.4"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">DHCP Range</label>
                        <input
                          type="text"
                          value={subnet.dhcp_range}
                          onChange={(e) => {
                            const newSubnets = [...formData.subnets];
                            newSubnets[index].dhcp_range = e.target.value;
                            setFormData(prev => ({ ...prev, subnets: newSubnets }));
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">VLAN</label>
                        <input
                          type="number"
                          value={subnet.vlan}
                          onChange={(e) => {
                            const newSubnets = [...formData.subnets];
                            newSubnets[index].vlan = parseInt(e.target.value);
                            setFormData(prev => ({ ...prev, subnets: newSubnets }));
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          min="1"
                          max="4094"
                        />
                      </div>
                    </div>
                    {formData.subnets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newSubnets = formData.subnets.filter((_, i) => i !== index);
                          setFormData(prev => ({ ...prev, subnets: newSubnets }));
                        }}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove Subnet
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      subnets: [...prev.subnets, {
                        subnet_address: '',
                        gateway: '',
                        dns: [''],
                        dhcp_range: '',
                        vlan: 1
                      }]
                    }));
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Add Another Subnet
                </button>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedNetwork(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  {showEditModal ? 'Save Changes' : 'Add Network'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this network? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedNetwork(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => selectedNetwork && handleDelete(selectedNetwork)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkDocs;