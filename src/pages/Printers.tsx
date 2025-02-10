import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Printer as PrinterIcon, Plus, X, Trash2, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logActivity } from '../lib/activity';

interface Printer {
  id: string;
  location: string;
  ip_address: string;
  vendor: string;
  model: string;
  print_deploy_info: string;
}

const Printers = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null);
  const [formData, setFormData] = useState<Omit<Printer, 'id'>>({
    location: '',
    ip_address: '',
    vendor: '',
    model: '',
    print_deploy_info: ''
  });

  const fetchPrinters = async () => {
    const { data, error } = await supabase
      .from('printers')
      .select('*')
      .eq('client_id', clientId)
      .order('location');

    if (error) {
      console.error('Error fetching printers:', error);
      return;
    }

    setPrinters(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (showEditModal && selectedPrinter) {
      // Update existing printer
      const { data: updatedPrinter, error } = await supabase
        .from('printers')
        .update({
          ...formData
        })
        .eq('id', selectedPrinter.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating printer:', error);
        return;
      }

      if (updatedPrinter) {
        await logActivity(
          'UPDATE',
          'PRINTER',
          updatedPrinter.id,
          `Updated printer: ${updatedPrinter.location}`
        );
      }
    } else {
      // Create new printer
      const { data: newPrinter, error } = await supabase
        .from('printers')
        .insert([{
          client_id: clientId,
          ...formData
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating printer:', error);
        return;
      }

      if (newPrinter) {
        await logActivity(
          'CREATE',
          'PRINTER',
          newPrinter.id,
          `Created new printer: ${newPrinter.location}`
        );
      }
    }

    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedPrinter(null);
    resetForm();
    fetchPrinters();
  };

  const handleEdit = (printer: Printer) => {
    setSelectedPrinter(printer);
    setFormData({
      location: printer.location,
      ip_address: printer.ip_address,
      vendor: printer.vendor,
      model: printer.model,
      print_deploy_info: printer.print_deploy_info || ''
    });
    setShowEditModal(true);
  };

  const handleDelete = async (printer: Printer) => {
    const { data, error } = await supabase
      .from('printers')
      .delete()
      .eq('id', printer.id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting printer:', error);
      return;
    }

    if (data) {
      await logActivity(
        'DELETE',
        'PRINTER',
        data.id,
        `Deleted printer: ${data.location}`
      );
    }

    setShowDeleteModal(false);
    setSelectedPrinter(null);
    fetchPrinters();
  };

  const resetForm = () => {
    setFormData({
      location: '',
      ip_address: '',
      vendor: '',
      model: '',
      print_deploy_info: ''
    });
  };

  useEffect(() => {
    if (clientId) {
      fetchPrinters();
    }
  }, [clientId]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Printer Documentation</h1>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-5 h-5" />
          Add New Printer
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          {printers.length === 0 ? (
            <div className="text-center py-12">
              <PrinterIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No printers</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding a new printer.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {printers.map((printer) => (
                <div key={printer.id} className="border rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {printer.location}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(printer)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPrinter(printer);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">IP Address</p>
                      <p className="font-medium">{printer.ip_address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Vendor</p>
                      <p className="font-medium">{printer.vendor}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Model</p>
                      <p className="font-medium">{printer.model}</p>
                    </div>
                    {printer.print_deploy_info && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500">Print Deploy Info</p>
                        <p className="font-medium">{printer.print_deploy_info}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Printer Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {showEditModal ? 'Edit Printer' : 'Add New Printer'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setSelectedPrinter(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">IP Address</label>
                <input
                  type="text"
                  value={formData.ip_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, ip_address: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Vendor</label>
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Model</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Print Deploy Info</label>
                <textarea
                  value={formData.print_deploy_info}
                  onChange={(e) => setFormData(prev => ({ ...prev, print_deploy_info: e.target.value }))}
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
                    setSelectedPrinter(null);
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
                  {showEditModal ? 'Save Changes' : 'Add Printer'}
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
              Are you sure you want to delete this printer? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedPrinter(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => selectedPrinter && handleDelete(selectedPrinter)}
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

export default Printers;