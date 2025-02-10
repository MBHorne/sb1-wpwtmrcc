import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Package } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface InboundPackage {
  id: string;
  package_type: string;
  received_by: string;
  atera_ticket_id: string;
  serial_number: string | null;
  status: 'OK' | 'WARNING' | 'CRITICAL';
  received_date: string;
  expected_date: string;
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
}

const M365 = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [packages, setPackages] = useState<InboundPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      const { data, error } = await supabase
        .from('inbound_packages')
        .select('*')
        .eq('client_id', clientId)
        .order('expected_date', { ascending: false });

      if (error) {
        console.error('Error fetching packages:', error);
        return;
      }

      setPackages(data || []);
      setLoading(false);
    };

    if (clientId) {
      fetchPackages();
    }
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No packages</h3>
        <p className="mt-1 text-sm text-gray-500">
          No inbound packages found for this client.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Inbound Packages</h2>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Package Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Serial Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Received By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expected Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Completion
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

              return (
                <tr key={pkg.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[pkg.status]}`}>
                      {pkg.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pkg.package_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pkg.serial_number || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pkg.received_by}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(pkg.expected_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pkg.completed ? (
                      <div className="text-green-600">
                        <div>Completed {new Date(pkg.completed_at!).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">by {pkg.completed_by}</div>
                      </div>
                    ) : (
                      <span className="text-yellow-600">Pending</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default M365;