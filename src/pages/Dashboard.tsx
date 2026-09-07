import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Calendar as CalendarIcon, Clock, CheckCircle } from 'lucide-react';

type BookingRecord = Record<string, unknown>;

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingBookings: 0,
    activeWorkers: 0,
    completedBookings: 0,
  });
  const [recentBookings, setRecentBookings] = useState<BookingRecord[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    // 1. Total bookings
    const { count: totalBookings } = await supabase.from('bookings').select('*', { count: 'exact', head: true });
    
    // 2. Upcoming bookings (pending or confirmed)
    const { count: upcomingBookings } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).in('status', ['pending', 'confirmed']);
    
    // 3. Completed bookings
    const { count: completedBookings } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed');
    
    // 4. Active workers
    const { count: activeWorkers } = await supabase.from('workers').select('*', { count: 'exact', head: true }).eq('status', 'active');

    // 5. Recent bookings
    const { data: recent } = await supabase.from('bookings').select('*, packages(name), workers(name)').order('created_at', { ascending: false }).limit(5);

    setStats({
      totalBookings: totalBookings || 0,
      upcomingBookings: upcomingBookings || 0,
      activeWorkers: activeWorkers || 0,
      completedBookings: completedBookings || 0,
    });
    
    if (recent) setRecentBookings(recent as BookingRecord[]);
  };

  const statCards = [
    { name: 'Total Bookings', value: stats.totalBookings, icon: CalendarIcon, color: 'bg-blue-500' },
    { name: 'Upcoming Bookings', value: stats.upcomingBookings, icon: Clock, color: 'bg-orange-500' },
    { name: 'Completed Bookings', value: stats.completedBookings, icon: CheckCircle, color: 'bg-green-500' },
    { name: 'Active Workers', value: stats.activeWorkers, icon: Users, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6 flex items-center gap-4">
            <div className={`p-3 rounded-full text-white ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.name}</p>
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Bookings</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentBookings.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No recent bookings</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {recentBookings.map((booking) => (
                <li key={booking.id as string} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{booking.customer_name as string}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(booking.booking_date as string).toLocaleDateString()} - {booking.service_booked as string}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        booking.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : 
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {(booking.status as string).toUpperCase()}
                      </span>
                      {((booking.workers as Record<string, unknown>)?.name as string | undefined) && (
                        <p className="text-xs text-gray-500 mt-1">Worker: {((booking.workers as Record<string, unknown>).name) as string}</p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}