import React, { useRef } from 'react';
import { printReceipt } from '../utils/receiptGenerator';

interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface ReceiptProps {
  storeInfo?: {
    name: string;
    address: string;
    phone: string;
    email?: string;
  };
  transactionId?: string;
  cashier?: string;
  items?: ReceiptItem[];
  paymentMethod?: string;
  onPrint?: () => void;
}

const POSReceipt: React.FC<ReceiptProps> = ({
  storeInfo = {
    name: "SmartPOS Store",
    address: "123 Business Street, Downtown, NY 10001",
    phone: "(555) 123-4567",
    email: "info@smartpos.com"
  },
  transactionId = "TXN-2025-090201",
  cashier = "Salesperson",
  items = [],
  paymentMethod = "Cash",
  onPrint
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxRate = 0.08; // 8% tax rate
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;
  
  const currentDate = new Date();
  const receiptDate = currentDate.toLocaleDateString();
  const receiptTime = currentDate.toLocaleTimeString();

  const handlePrint = () => {
    // Use the utility function for consistent printing
    printReceipt({
      storeInfo,
      transactionId,
      cashier,
      items,
      paymentMethod,
      date: new Date()
    });
    
    if (onPrint) {
      onPrint();
    }
  };

  return (
    <div className="receipt-wrapper">
      <div ref={receiptRef} className="max-w-sm mx-auto bg-white p-6 font-mono text-sm border border-gray-300 shadow-lg">
        {/* Store Header */}
        <div className="text-center mb-4 pb-4 border-b border-gray-400">
          <h1 className="text-lg font-bold mb-2">{storeInfo.name}</h1>
          <p className="text-xs leading-relaxed">{storeInfo.address}</p>
          <p className="text-xs">{storeInfo.phone}</p>
          {storeInfo.email && <p className="text-xs">{storeInfo.email}</p>}
        </div>

        {/* Transaction Info */}
        <div className="mb-4 text-xs">
          <div className="flex justify-between">
            <span>Date: {receiptDate}</span>
            <span>Time: {receiptTime}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Transaction: {transactionId}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Cashier: {cashier}</span>
          </div>
        </div>

        {/* Items */}
        <div className="mb-4 pb-4 border-b border-gray-400">
          <div className="flex justify-between text-xs font-bold mb-2">
            <span>ITEM</span>
            <span>QTY × PRICE = TOTAL</span>
          </div>
          
          {items.map((item) => (
            <div key={item.id} className="mb-2">
              <div className="text-xs">{item.name}</div>
              <div className="flex justify-between text-xs">
                <span></span>
                <span>
                  {item.quantity} × ₹{item.price.toFixed(2)} = ₹{item.total.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mb-4 text-xs">
          <div className="flex justify-between mb-1">
            <span>Subtotal:</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Tax (8%):</span>
            <span>₹{taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t border-gray-400 pt-2">
            <span>TOTAL:</span>
            <span>₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Info */}
        <div className="mb-4 text-xs border-t border-gray-400 pt-2">
          <div className="flex justify-between">
            <span>Payment Method:</span>
            <span>{paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span>Amount Paid:</span>
            <span>₹{totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Change:</span>
            <span>₹0.00</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs border-t border-gray-400 pt-4">
          <p className="mb-2">Thank you for shopping with us!</p>
          <p className="mb-1">Return Policy: 30 days with receipt</p>
          <p className="mb-1">Customer Service: (555) 123-4567</p>
          <div className="mt-4 text-center">
            <div className="inline-block bg-black text-white px-2 py-1 font-mono text-xs">
              |||||| |||| |||||| |||||| ||||||
            </div>
            <p className="text-xs mt-1">{transactionId}</p>
          </div>
        </div>
      </div>
      
      {/* Print Button */}
      <div className="text-center mt-4">
        <button
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center mx-auto gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Receipt
        </button>
      </div>
    </div>
  );
};

export default POSReceipt;
