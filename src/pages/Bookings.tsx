import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

type BookingRecord = Record<string, unknown>;
type WorkerRecord = Record<string, unknown>;
type PackageRecord = Record<string, unknown>;

export default function Bookings() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [workers, setWorkers] = useState<WorkerRecord[]>([]);
  const [packages, setPackages] = useState<PackageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<BookingRecord | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_contact: '',
    customer_address: '',
    booking_date: new Date().toISOString().split('T')[0],
    service_booked: '',
    package_id: '',
    package_amount: '',
    notes: '',
    status: 'pending',
    worker_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [bookingsRes, workersRes, packagesRes] = await Promise.all([
      supabase.from('bookings').select('*, workers(name), packages(name)').order('created_at', { ascending: false }),
      supabase.from('workers').select('*').eq('status', 'active'),
      supabase.from('packages').select('*')
    ]);

    if (bookingsRes.data) setBookings(bookingsRes.data as BookingRecord[]);
    if (workersRes.data) setWorkers(workersRes.data as WorkerRecord[]);
    if (packagesRes.data) setPackages(packagesRes.data as PackageRecord[]);
    setLoading(false);
  };

  const openModal = (booking: BookingRecord | null = null) => {
    if (booking) {
      setEditingBooking(booking);
      setFormData({
        customer_name: (booking.customer_name as string) || '',
        customer_contact: (booking.customer_contact as string) || '',
        customer_address: (booking.customer_address as string) || '',
        booking_date: (booking.booking_date as string) || new Date().toISOString().split('T')[0],
        service_booked: (booking.service_booked as string) || '',
        package_id: (booking.package_id as string) || '',
        package_amount: booking.package_amount?.toString() || '',
        notes: (booking.notes as string) || '',
        status: (booking.status as string) || 'pending',
        worker_id: (booking.worker_id as string) || ''
      });
    } else {
      setEditingBooking(null);
      setFormData({
        customer_name: '', customer_contact: '', customer_address: '', 
        booking_date: new Date().toISOString().split('T')[0],
        service_booked: '', package_id: '', package_amount: '', notes: '', 
        status: 'pending', worker_id: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      package_id: formData.package_id || null,
      package_amount: formData.package_amount ? parseFloat(formData.package_amount) : null,
      worker_id: formData.worker_id || null
    };

    if (editingBooking) {
      await supabase.from('bookings').update(payload).eq('id', editingBooking.id as string);
    } else {
      await supabase.from('bookings').insert([payload]);
    }
    
    closeModal();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return; // double check UI only
    if (window.confirm('Are you sure you want to delete this booking?')) {
      await supabase.from('bookings').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Booking
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading bookings...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Worker</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id as string}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{booking.customer_name as string}</div>
                    <div className="text-sm text-gray-500">{booking.customer_contact as string}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{booking.service_booked as string}</div>
                    <div className="text-xs text-gray-500">{(booking.packages as Record<string, unknown>)?.name as string}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(booking.booking_date as string).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(booking.workers as Record<string, unknown>)?.name as string || <span className="text-gray-400 italic">Unassigned</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      booking.status === 'completed' ? 'bg-green-100 text-green-800' : 
                      booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : 
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {(booking.status as string).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openModal(booking)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                      <button onClick={() => handleDelete(booking.id as string)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={closeModal}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {editingBooking ? 'Edit Booking' : 'Create Booking'}
                  </h3>
                  <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                      <input type="text" required value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                      <input type="text" value={formData.customer_contact} onChange={e => setFormData({...formData, customer_contact: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Booking Date</label>
                      <input type="date" required value={formData.booking_date} onChange={e => setFormData({...formData, booking_date: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Service Required</label>
                      <input type="text" required placeholder="e.g., Deep Cleaning, Full-time Nanny" value={formData.service_booked} onChange={e => setFormData({...formData, service_booked: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Package (Optional)</label>
                      <select value={formData.package_id} onChange={e => {
                        const pkg = packages.find(p => p.id === e.target.value);
                        setFormData({...formData, package_id: e.target.value, package_amount: pkg ? String(pkg.amount) : ''})
                      }} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                        <option value="">-- Select Package --</option>
                        {packages.map(pkg => (
                          <option key={pkg.id as string} value={pkg.id as string}>{pkg.name as string} (${pkg.amount as number})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount</label>
                      <input type="number" value={formData.package_amount} onChange={e => setFormData({...formData, package_amount: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Assign Worker</label>
                      <select value={formData.worker_id} onChange={e => setFormData({...formData, worker_id: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                        <option value="">-- Unassigned --</option>
                        {workers.map(worker => (
                          <option key={worker.id as string} value={worker.id as string}>{worker.name as string} ({worker.worker_type as string})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse -mx-4 -mb-4 mt-6">
                    <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm">
                      Save Booking
                    </button>
                    <button type="button" onClick={closeModal} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}