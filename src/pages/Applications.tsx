import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AppWindow, Plus, X, Trash2, Edit, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logActivity } from '../lib/activity';

interface Application {
  id: string;
  name: string;
  vendor: string;
  version: string;
  license_type: string;
  expiry_date: string | null;
  installation_path: string;
  notes: string;
  support_url: string;
  critical: boolean;
}

const Applications = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [applications, setApplications] = useState<Application[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Omit<Application, 'id'>>({
    name: '',
    vendor: '',
    version: '',
    license_type: '',
    expiry_date: null,
    installation_path: '',
    notes: '',
    support_url: '',
    critical: false
  });

  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('client_id', clientId)
      .order('name');

    if (error) {
      console.error('Error fetching applications:', error);
      return;
    }

    setApplications(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (showEditModal && selectedApp) {
      const { data: updatedApp, error } = await supabase
        .from('applications')
        .update({
          ...formData
        })
        .eq('id', selectedApp.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating application:', error);
        return;
      }

      if (updatedApp) {
        await logActivity(
          'UPDATE',
          'APPLICATION',
          updatedApp.id,
          `Updated application: ${updatedApp.name}`
        );
      }
    } else {
      const { data: newApp, error } = await supabase
        .from('applications')
        .insert([{
          client_id: clientId,
          ...formData
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating application:', error);
        return;
      }

      if (newApp) {
        await logActivity(
          'CREATE',
          'APPLICATION',
          newApp.id,
          `Created new application: ${newApp.name}`
        );
      }
    }

    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedApp(null);
    resetForm();
    fetchApplications();
  };

  const handleEdit = (app: Application) => {
    setSelectedApp(app);
    setFormData({
      name: app.name,
      vendor: app.vendor,
      version: app.version,
      license_type: app.license_type,
      expiry_date: app.expiry_date,
      installation_path: app.installation_path,
      notes: app.notes || '',
      support_url: app.support_url || '',
      critical: app.critical
    });
    setShowEditModal(true);
  };

  const handleDelete = async (app: Application) => {
    const { data, error } = await supabase
      .from('applications')
      .delete()
      .eq('id', app.id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting application:', error);
      return;
    }

    if (data) {
      await logActivity(
        'DELETE',
        'APPLICATION',
        data.id,
        `Deleted application: ${data.name}`
      );
    }

    setShowDeleteModal(false);
    setSelectedApp(null);
    fetchApplications();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      vendor: '',
      version: '',
      license_type: '',
      expiry_date: null,
      installation_path: '',
      notes: '',
      support_url: '',
      critical: false
    });
  };

  useEffect(() => {
    if (clientId) {
      fetchApplications();
    }
  }, [clientId]);

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
        <h1 className="text-2xl font-bold text-gray-800">Applications</h1>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-5 h-5" />
          Add New Application
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {applications.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <AppWindow className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding a new application.
            </p>
          </div>
        ) : (
          applications.map((app) => (
            <div 
              key={app.id} 
              className={`border rounded-lg p-6 ${
                app.critical ? 'border-red-200 bg-red-50' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    {app.name}
                    {app.critical && (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        Critical
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600">{app.vendor}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(app)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedApp(app);
                      setShowDeleteModal(true);
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Version</p>
                  <p className="font-medium">{app.version}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">License Type</p>
                  <p className="font-medium">{app.license_type}</p>
                </div>
                {app.expiry_date && (
                  <div>
                    <p className="text-sm text-gray-500">License Expiry</p>
                    <p className="font-medium">
                      {new Date(app.expiry_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Installation Path</p>
                  <p className="font-medium font-mono text-sm">{app.installation_path}</p>
                </div>
                {app.support_url && (
                  <div>
                    <p className="text-sm text-gray-500">Support</p>
                    <a
                      href={app.support_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      Support Portal
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
                {app.notes && (
                  <div>
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="text-sm">{app.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Application Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center overflow-y-auto">
          <div className="bg-white p-6 rounded-lg max-w-md w-full m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {showEditModal ? 'Edit Application' : 'Add New Application'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setSelectedApp(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Application Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Vendor
                </label>
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Version
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  License Type
                </label>
                <input
                  type="text"
                  value={formData.license_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, license_type: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  License Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.expiry_date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Installation Path
                </label>
                <input
                  type="text"
                  value={formData.installation_path}
                  onChange={(e) => setFormData(prev => ({ ...prev, installation_path: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Support URL
                </label>
                <input
                  type="url"
                  value={formData.support_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, support_url: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="https://"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="critical"
                  checked={formData.critical}
                  onChange={(e) => setFormData(prev => ({ ...prev, critical: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="critical" className="ml-2 block text-sm text-gray-900">
                  Mark as Critical Application
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedApp(null);
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
                  {showEditModal ? 'Save Changes' : 'Add Application'}
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
              Are you sure you want to delete this application? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedApp(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => selectedApp && handleDelete(selectedApp)}
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

export default Applications;