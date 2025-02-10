import React, { useState, useEffect } from 'react';
import { Link, Save, RefreshCw, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AteraSettings {
  id: string;
  api_key: string;
  api_url: string;
}

interface AteraCustomer {
  CustomerID: number;
  CustomerName: string;
}

interface CustomerMapping {
  client_id: string;
  atera_customer_id: string;
}

const Integration = () => {
  const [settings, setSettings] = useState<AteraSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<AteraCustomer[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string; }[]>([]);
  const [mappings, setMappings] = useState<CustomerMapping[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [formData, setFormData] = useState({
    api_key: '',
    api_url: 'https://app.atera.com/api/v3'
  });

  useEffect(() => {
    Promise.all([
      fetchSettings(),
      fetchClients(),
      fetchMappings()
    ]);
  }, []);

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

  const fetchMappings = async () => {
    const { data, error } = await supabase
      .from('atera_customer_mappings')
      .select('*');

    if (error) {
      console.error('Error fetching mappings:', error);
      return;
    }

    setMappings(data || []);
  };

  const fetchAteraCustomers = async () => {
    if (!settings?.api_key) {
      console.error('No API key configured');
      alert('Please configure and save your API key first');
      setLoadingCustomers(false);
      return;
    }

    setLoadingCustomers(true);
    try {
      const response = await fetch('/api/cors-proxy', {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          url: `${settings.api_url}/customers`,
          method: 'GET',
          headers: {
            'X-API-KEY': settings.api_key
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch customers (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      setCustomers(data.items || []);
    } catch (error) {
      console.error('Error fetching Atera customers:', error);
      alert('Failed to fetch Atera customers. Please check your API configuration and try again.');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleMapping = async (clientId: string, ateraCustomerId: string) => {
    // Remove any existing mapping for this client
    const { error: deleteError } = await supabase
      .from('atera_customer_mappings')
      .delete()
      .eq('client_id', clientId);

    if (deleteError) {
      console.error('Error removing existing mapping:', deleteError);
      return;
    }

    // Add new mapping
    const { error: insertError } = await supabase
      .from('atera_customer_mappings')
      .insert([{
        client_id: clientId,
        atera_customer_id: ateraCustomerId
      }]);

    if (insertError) {
      console.error('Error creating mapping:', insertError);
      return;
    }

    await fetchMappings();
  };

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('atera_settings')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching settings:', error);
      return;
    }

    if (data) {
      setSettings(data);
      setFormData({
        api_key: data.api_key,
        api_url: data.api_url
      });
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let result;
    
    if (settings?.id) {
      // Update existing settings
      result = await supabase
        .from('atera_settings')
        .update(formData)
        .eq('id', settings.id);
    } else {
      // Insert new settings
      result = await supabase
        .from('atera_settings')
        .insert([formData]);
    }

    if (result.error) {
      console.error('Error saving settings:', result.error);
      alert('Failed to save settings. Please try again.');
      setSaving(false);
      return;
    }

    alert('Settings saved successfully!');

    await Promise.all([
      fetchSettings(),
      fetchAteraCustomers()
    ]);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Integration Settings</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-6">
          <Link className="w-6 h-6 text-blue-500" />
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Atera Integration</h2>
            <p className="text-sm text-gray-600 mt-1">Configure your Atera API settings and map customers</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              API Key
            </label>
            <input
              type="password"
              value={formData.api_key}
              onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              API URL
            </label>
            <input
              type="url"
              value={formData.api_url}
              onChange={(e) => setFormData(prev => ({ ...prev, api_url: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      {settings?.api_key && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Building2 className="w-6 h-6 text-blue-500" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Customer Mappings</h2>
                  <p className="text-sm text-gray-600">Map Atera customers to MSP Manager clients</p>
                </div>
              </div>
              <button
                onClick={fetchAteraCustomers}
                disabled={loadingCustomers}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <RefreshCw className={`w-4 h-4 ${loadingCustomers ? 'animate-spin' : ''}`} />
                Refresh Customers
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MSP Manager Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Atera Customer
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => {
                  const mapping = mappings.find(m => m.client_id === client.id);
                  return (
                    <tr key={client.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={mapping?.atera_customer_id || ''}
                          onChange={(e) => handleMapping(client.id, e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        >
                          <option value="">Select Atera Customer</option>
                          {customers.map((customer) => (
                            <option key={customer.CustomerID} value={customer.CustomerID.toString()}>
                              {customer.CustomerName}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Integration;