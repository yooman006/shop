import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SummaryApi from '../common/SummaryApi';
import { IoIosSearch } from "react-icons/io";

const baseURL = import.meta.env.VITE_API_URL;

const AllOrders = () => {
  const [orders, setOrders] = useState([]);  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${baseURL}${SummaryApi.getAllOrder.url}`);
        console.log("Full API Response:", response.data);

        if (Array.isArray(response.data)) {
          setOrders(response.data);
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          setOrders(response.data.data);
        } else {
          console.warn("API response format unexpected:", response.data);
          setOrders([]);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleReceivedChange = async (orderId, newStatus) => {
    try {
      const receivedValue = newStatus === "true"; 
      await axios.put(`${baseURL}/api/order/status/${orderId}`, { received: receivedValue });
      setOrders(orders.map(order => 
        order.orderId === orderId ? { ...order, received: receivedValue } : order
      ));
    } catch (error) {
      console.error("Error updating received status:", error);
    }
  };

  // Filter orders based on last 4 digits of orderId
  const filteredOrders = searchTerm
    ? orders.filter(order => order.orderId?.slice(-4) === searchTerm)
    : orders;

  return (
    <div className="p-4">
      <div className="bg-white shadow-md p-4 font-semibold text-lg mb-4 border-b flex justify-between">
        <h1>All Orders</h1>
        <div className="relative">
          <IoIosSearch className="absolute left-3 top-3 text-gray-500" />
          <input
            type="text"
            placeholder="Search Order ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-md text-sm focus:ring focus:ring-blue-300"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-600">Loading orders...</p>
      ) : filteredOrders.length === 0 ? (
        <p className="text-center text-gray-600">No Orders Found</p>
      ) : (
        filteredOrders.map((order, index) => (
          <div key={order._id || index} className="border rounded-md p-4 text-sm my-4 shadow-md bg-white">
            <p className="font-semibold text-lg">
              Order No: <span className="text-blue-600">{order?.orderId || "N/A"}</span>
            </p>
            <p className="text-gray-700">Total Amount: <span className="font-medium">₹{order?.totalAmt || "0.00"}</span></p>
            <p className="text-gray-700">Payment Status: <span className="font-medium">{order?.payment_status || "Unknown"}</span></p>

            <p className="text-gray-700">
              <strong>Mobile No:</strong> 
              <span className="font-medium ml-1">
                {order.delivery_address?.mobile || "Not Provided"}
              </span>
            </p>

            <p className="text-gray-700">
              <strong>Delivery Address:</strong> 
              <span className="font-medium ml-1">
                {order.delivery_address?.address_line || "Not Provided"}
              </span>
            </p>
            <div className="mt-3">
              <h2 className="font-semibold text-md mb-2">Ordered Items:</h2>
              <ul className="list-disc pl-5 text-gray-800">
                {Array.isArray(order.products) ? order.products.map((product, i) => (
                  <li key={i}>
                    {product?.product_details?.name || "Unnamed Product"} - 
                    <strong> Qty:</strong> {product?.quantity || 0} - 
                    <strong> Price:</strong> ₹{product?.product_details?.price || "0.00"}
                  </li>
                )) : <li>No products available</li>}
              </ul>
            </div>
            <div className="mt-3">
              <label className="font-semibold">Received Status:</label>
              <select 
                value={order.received ? "true" : "false"} 
                onChange={(e) => handleReceivedChange(order.orderId, e.target.value)}
                className="ml-2 p-1 border rounded"
              >
                <option value="false">Not Received</option>
                <option value="true">Received</option>
              </select>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AllOrders;
