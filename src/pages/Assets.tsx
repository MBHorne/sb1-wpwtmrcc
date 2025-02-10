import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Plus, X, Trash2, Edit, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logActivity } from '../lib/activity';

interface Asset {
  id: string;
  name: string;
  type: string;
  model: string;
  serial_number: string;
  purchase_date: string | null;
  warranty_expiry: string | null;
  location: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'RETIRED';
  assigned_to: string;
  notes: string;
}

const Assets = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Omit<Asset, 'id'>>({
    name: '',
    type: '',
    model: '',
    serial_number: '',
    purchase_date: null,
    warranty_expiry: null,
    location: '',
    status: 'ACTIVE',
    assigned_to: '',
    notes: ''
  });

  const fetchAssets = async () => {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('client_id', clientId)
      .order('name');

    if (error) {
      console.error('Error fetching assets:', error);
      return;
    }

    setAssets(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (showEditModal && selectedAsset) {
      const { data: updatedAsset, error } = await supabase
        .from('assets')
        .update({
          ...formData
        })
        .eq('id', selectedAsset.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating asset:', error);
        return;
      }

      if (updatedAsset) {
        await logActivity(
          'UPDATE',
          'ASSET',
          updatedAsset.id,
          `Updated asset: ${updatedAsset.name}`
        );
      }
    } else {
      const { data: newAsset, error } = await supabase
        .from('assets')
        .insert([{
          client_id: clientId,
          ...formData
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating asset:', error);
        return;
      }

      if (newAsset) {
        await logActivity(
          'CREATE',
          'ASSET',
          newAsset.id,
          `Created new asset: ${newAsset.name}`
        );
      }
    }

    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedAsset(null);
    resetForm();
    fetchAssets();
  };

  const handleEdit = (asset: Asset) => {
    setSelectedAsset(asset);
    setFormData({
      name: asset.name,
      type: asset.type,
      model: asset.model,
      serial_number: asset.serial_number,
      purchase_date: asset.purchase_date,
      warranty_expiry: asset.warranty_expiry,
      location: asset.location,
      status: asset.status,
      assigned_to: asset.assigned_to,
      notes: asset.notes || ''
    });
    setShowEditModal(true);
  };

  const handleDelete = async (asset: Asset) => {
    const { data, error } = await supabase
      .from('assets')
      .delete()
      .eq('id', asset.id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting asset:', error);
      return;
    }

    if (data) {
      await logActivity(
        'DELETE',
        'ASSET',
        data.id,
        `Deleted asset: ${data.name}`
      );
    }

    setShowDeleteModal(false);
    setSelectedAsset(null);
    fetchAssets();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      model: '',
      serial_number: '',
      purchase_date: null,
      warranty_expiry: null,
      location: '',
      status: 'ACTIVE',
      assigned_to: '',
      notes: ''
    });
  };

  const getStatusColor = (status: Asset['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800';
      case 'RETIRED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchAssets();
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
        <h1 className="text-2xl font-bold text-gray-800">Assets</h1>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-5 h-5" />
          Add New Asset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {assets.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Box className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No assets</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding a new asset.
            </p>
          </div>
        ) : (
          assets.map((asset) => (
            <div key={asset.id} className="border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {asset.name}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(asset.status)}`}>
                    {asset.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(asset)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAsset(asset);
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
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">{asset.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Model</p>
                  <p className="font-medium">{asset.model}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Serial Number</p>
                  <p className="font-medium font-mono text-sm">{asset.serial_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{asset.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Assigned To</p>
                  <p className="font-medium">{asset.assigned_to}</p>
                </div>
                {asset.purchase_date && (
                  <div>
                    <p className="text-sm text-gray-500">Purchase Date</p>
                    <p className="font-medium">
                      {new Date(asset.purchase_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {asset.warranty_expiry && (
                  <div>
                    <p className="text-sm text-gray-500">Warranty Expiry</p>
                    <p className="font-medium">
                      {new Date(asset.warranty_expiry).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {asset.notes && (
                  <div>
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="text-sm">{asset.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Asset Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center overflow-y-auto">
          <div className="bg-white p-6 rounded-lg max-w-md w-full m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {showEditModal ? 'Edit Asset' : 'Add New Asset'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setSelectedAsset(null);
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
                  Asset Name
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
                  Type
                </label>
                <input
                  type="text"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Model
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={formData.serial_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Assigned To
                </label>
                <input
                  type="text"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Asset['status'] }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="RETIRED">Retired</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={formData.purchase_date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Warranty Expiry
                </label>
                <input
                  type="date"
                  value={formData.warranty_expiry || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, warranty_expiry: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedAsset(null);
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
                  {showEditModal ? 'Save Changes' : 'Add Asset'}
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
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Confirm Delete</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this asset? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedAsset(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => selectedAsset && handleDelete(selectedAsset)}
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

export default Assets;