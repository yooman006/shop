import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import NoData from '../components/NoData';
import html2canvas from 'html2canvas';
import { IoIosSearch } from "react-icons/io";

const MyOrders = () => {
  const orders = useSelector(state => state.orders.order || []);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const receiptRef = useRef(null);

  const handleDownloadReceipt = async (order) => {
    setSelectedOrder(order);
    setTimeout(async () => {
      if (receiptRef.current) {
        receiptRef.current.style.display = "block";  // Ensure visibility
        const canvas = await html2canvas(receiptRef.current, {
          backgroundColor: "#fff",
          useCORS: true
        });
        receiptRef.current.style.display = "none";  // Hide again
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `Receipt_${order.orderId}.png`;
        link.click();
      }
    }, 500);
  };

  // Filter orders based on the last 4 digits of the order ID
  const filteredOrders = orders.filter(order =>
    order.orderId.slice(-4).includes(searchTerm)
  );

  return (
    <div className="p-4">
      <div className='bg-white shadow-md p-4 font-semibold text-lg mb-4 border-b flex justify-between items-center'>
        <h1>My Orders</h1>
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

      {filteredOrders.length === 0 ? <NoData /> : filteredOrders.map((order, index) => (
        <div key={order.orderId + index} className='border rounded-md p-4 text-sm my-4 shadow-md bg-white'>
          <p className='font-semibold text-lg'>
            Order No: <a href="#" className="text-blue-600">{order?.orderId}</a>
          </p>
          <p className='text-gray-700'>Total Amount: <span className="font-medium">₹{order.totalAmt}</span></p>
          <p className='text-gray-700'>Payment Status: <span className="font-medium">{order.payment_status}</span></p>

          <p className="text-gray-700">
            <strong>Mobile No:</strong>
            <span className="font-medium ml-1">
              {order.delivery_address
                ? (typeof order.delivery_address === 'object'
                  ? `${order.delivery_address.mobile || ''}`
                  : order.delivery_address)
                : "Not Provided"}
            </span>
          </p>

          <p className="text-gray-700">
            <strong>Delivery Address:</strong>
            <span className="font-medium ml-1">
              {order.delivery_address
                ? (typeof order.delivery_address === 'object'
                  ? `${order.delivery_address.address_line || ''}, ${order.delivery_address.city || ''}, ${order.delivery_address.pincode || ''}`
                  : order.delivery_address)
                : "Not Provided"}
            </span>
          </p>

         {/* <div className='mt-3'>
            <h2 className='font-semibold text-md mb-2'>Ordered Items:</h2>
            <ul className="list-disc pl-5 text-gray-800">
              {order.products.map((product, index) => (
                <li key={index}>
                  {product.product_details?.name || "Unnamed Product"} -
                  <strong> Qty:</strong> {product.quantity} -
                  <strong> Price:</strong> ₹{product.product_details?.price || "N/A"}
                </li>
              ))}
            </ul>
          </div> */}

          {/* Display Received Status */}
          <p className='mt-2 text-gray-700'>
            <strong>Received Status:</strong>
            <span className={`ml-2 font-medium ${order.received ? "text-green-600" : "text-red-600"}`}>
              {order.received ? "Received" : "Not Received"}
            </span>
          </p>

          {/* Download Receipt Button */}
          <button
            onClick={() => handleDownloadReceipt(order)}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700">
            Download Receipt
          </button>
        </div>
      ))}

      {/* Receipt Template (Hidden by Default) */}
      <div ref={receiptRef} className="hidden p-5 border w-full max-w-xs mx-auto bg-white shadow-md text-center font-mono">
        {selectedOrder && (
          <>
            <h2 className="text-xl font-bold">Lakshmi Shop</h2>
            <p className="text-sm">113-9, Sattur Road, Sivagamipuram</p>
            <p className="text-sm">Sivakasi</p>
            <hr className="my-2 border-black" />
            <p className="text-xs">
              <strong className="text-xs">Order No:</strong>
              <span className="text-xs"> {selectedOrder.orderId}</span>
            </p>
            <hr className="my-2 border-black" />
            <div className="text-left">
              {selectedOrder.products.map((product, index) => (
                <p key={index} className="flex justify-between">
                  <span>{product.product_details?.name || "Unnamed Product"}</span>
                  <span>₹{product.product_details?.price || "N/A"}</span>
                </p>
              ))}
            </div>
            <hr className="my-2 border-black" />
            <p className="font-bold">TOTAL ₹{selectedOrder.totalAmt}</p>
            <hr className="my-2 border-black" />
            <p className="text-xs mt-2">Thank you for shopping with us!</p>
          </>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
