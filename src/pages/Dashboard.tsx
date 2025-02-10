import React, { useEffect, useState } from 'react';
import { Users, Package, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DashboardStats {
  totalClients: number;
  pendingInbound: number;
  criticalIssues: number;
  recentActivity: {
    id: string;
    action_type: string;
    resource_type: string;
    details: string;
    created_at: string;
  }[];
  recentInbound: {
    id: string;
    package_type: string;
    client: { name: string };
    received_date: string;
  }[];
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    pendingInbound: 0,
    criticalIssues: 0,
    recentActivity: [],
    recentInbound: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get total clients
        const { count: clientCount } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true });

        // Get pending inbound packages
        const { count: pendingCount } = await supabase
          .from('inbound_packages')
          .select('*', { count: 'exact', head: true })
          .eq('completed', false);

        // Get critical issues (packages past expected date)
        const today = new Date().toISOString().split('T')[0];
        const { count: criticalCount } = await supabase
          .from('inbound_packages')
          .select('*', { count: 'exact', head: true })
          .eq('completed', false)
          .lt('expected_date', today);

        // Get recent activity
        const { data: recentActivity } = await supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        // Get recent inbound packages
        const { data: recentInbound } = await supabase
          .from('inbound_packages')
          .select(`
            id,
            package_type,
            received_date,
            client:clients(name)
          `)
          .order('received_date', { ascending: false })
          .limit(5);

        setStats({
          totalClients: clientCount || 0,
          pendingInbound: pendingCount || 0,
          criticalIssues: criticalCount || 0,
          recentActivity: recentActivity || [],
          recentInbound: recentInbound || []
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalClients}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Inbound</p>
              <p className="text-2xl font-bold text-gray-800">{stats.pendingInbound}</p>
            </div>
            <Package className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical Issues</p>
              <p className="text-2xl font-bold text-gray-800">{stats.criticalIssues}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
          {stats.recentActivity.length === 0 ? (
            <p className="text-sm text-gray-500">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {stats.recentActivity.map(activity => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.action_type === 'CREATE' ? 'bg-green-500' :
                    activity.action_type === 'UPDATE' ? 'bg-blue-500' :
                    'bg-red-500'
                  }`}></div>
                  <div>
                    <p className="text-sm text-gray-800">{activity.details}</p>
                    <p className="text-xs text-gray-500">{new Date(activity.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Inbound</h2>
          {stats.recentInbound.length === 0 ? (
            <p className="text-sm text-gray-500">No recent inbound packages</p>
          ) : (
            <div className="space-y-4">
              {stats.recentInbound.map(pkg => (
                <div key={pkg.id} className="flex items-center space-x-4">
                  <Package className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-800">{pkg.package_type} for {pkg.client.name}</p>
                    <p className="text-xs text-gray-500">
                      Received {new Date(pkg.received_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;