
import { useEffect, useState } from 'react';
import { getCourierOrders } from '@/services/courierService';

interface ReturnOrder {
  id: string;
  fullName: string;
  status: string;
  createdAt: string;
}

const ReturnOrdersTable: React.FC = () => {
  const [returnOrders, setReturnOrders] = useState<ReturnOrder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReturnOrders = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('adminAuthToken') || '';
        const data = await getCourierOrders({ status: 'returned' }, token);
        if (data && data.orders) {
          setReturnOrders(data.orders);
        } else if (Array.isArray(data)) {
          setReturnOrders(data);
        } else if (data && data.length) {
          setReturnOrders(data);
        } else {
          setReturnOrders([]);
        }
      } catch (err) {
        setReturnOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReturnOrders();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Return Orders</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Order ID</th>
              <th className="py-2 px-4 border-b">Customer</th>
              <th className="py-2 px-4 border-b">Status</th>
              <th className="py-2 px-4 border-b">Date</th>
            </tr>
          </thead>
          <tbody>
            {returnOrders.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-4">No return orders found</td></tr>
            ) : (
              returnOrders.map(order => (
                <tr key={order.id}>
                  <td className="py-2 px-4 border-b">{order.id}</td>
                  <td className="py-2 px-4 border-b">{order.fullName}</td>
                  <td className="py-2 px-4 border-b">{order.status}</td>
                  <td className="py-2 px-4 border-b">{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ReturnOrdersTable;
