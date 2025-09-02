import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import api from '../lib/api';

interface CustomerDetails {
  name: string;
  mobile: string;
  email?: string;
  address?: string;
}

interface PaymentDetails {
  amount: number;
  paymentMode: string;
  transactionId: string;
  status: string;
  date: string;
  reference?: string;
  method?: string;
  type?: string;
}

interface ReceiptData {
  receiptNumber: string;
  date: string;
  customer: CustomerDetails;
  payment: PaymentDetails;
  description: string;
  businessName: string;
  businessContact: string;
  businessAddress: string[];
}

interface PaymentReceiptProps {
  paymentId?: string;
  paymentData?: any;
  onClose?: () => void;
}

const PaymentReceipt: React.FC<PaymentReceiptProps> = ({ paymentId, paymentData, onClose }) => {
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReceiptData = async () => {
      try {
        let finalPaymentData = paymentData;
        
        // If paymentId is provided, fetch data from backend
        if (paymentId && !paymentData) {
          const response = await api.get(`/payments/${paymentId}`);
          finalPaymentData = response.data;
        }

        // Get payment data from localStorage if no props provided
        if (!finalPaymentData) {
          const paymentDataStr = localStorage.getItem('payment_receipt');
          if (paymentDataStr) {
            finalPaymentData = JSON.parse(paymentDataStr);
          }
        }

        if (finalPaymentData) {
          const transformedData: ReceiptData = {
            receiptNumber: finalPaymentData.receiptNumber || `RCP-${finalPaymentData._id || Date.now()}`,
            date: finalPaymentData.date ? format(new Date(finalPaymentData.date), 'MMM dd, yyyy HH:mm') : format(new Date(), 'MMM dd, yyyy HH:mm'),
            customer: {
              name: finalPaymentData.customer || finalPaymentData.customerName || "Walk-in Customer",
              mobile: finalPaymentData.customerPhone || finalPaymentData.customerMobile || "N/A",
              email: finalPaymentData.customerEmail || "",
              address: finalPaymentData.customerAddress || ""
            },
            payment: {
              amount: finalPaymentData.amount || 0,
              paymentMode: (finalPaymentData.paymentMode || 'cash').toUpperCase(),
              transactionId: finalPaymentData.transactionId || finalPaymentData.reference || `TXN-${Date.now()}`,
              status: (finalPaymentData.status || 'completed').toUpperCase(),
              date: finalPaymentData.date ? format(new Date(finalPaymentData.date), 'MMM dd, yyyy HH:mm') : format(new Date(), 'MMM dd, yyyy HH:mm'),
              reference: finalPaymentData.reference || "",
              method: finalPaymentData.method || "",
              type: finalPaymentData.type || "payment"
            },
            description: finalPaymentData.description || finalPaymentData.service || "Payment received",
            businessName: "SmartPOS IMS",
            businessContact: "+91-9999999999",
            businessAddress: [
              "123 Business Street",
              "Business District",
              "City, State - 123456"
            ]
          };
          
          setReceiptData(transformedData);
        } else {
          setDefaultReceiptData();
        }
      } catch (error) {
        console.error('Error loading payment data:', error);
        setDefaultReceiptData();
      }
      setLoading(false);
    };

    loadReceiptData();
  }, [paymentId, paymentData]);

  const setDefaultReceiptData = () => {
    setReceiptData({
      receiptNumber: `RCP-${Date.now()}`,
      date: format(new Date(), 'MMM dd, yyyy HH:mm'),
      customer: {
        name: "John Doe",
        mobile: "9876543210",
        email: "john.doe@example.com",
        address: "123 Main Street, City"
      },
      payment: {
        amount: 500.00,
        paymentMode: "CASH",
        transactionId: "TXN123456789",
        status: "COMPLETED",
        date: format(new Date(), 'MMM dd, yyyy HH:mm'),
        reference: "REF001",
        method: "cash",
        type: "payment"
      },
      description: "Service payment",
      businessName: "SmartPOS IMS",
      businessContact: "+91-9999999999",
      businessAddress: [
        "123 Business Street",
        "Business District", 
        "City, State - 123456"
      ]
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      window.close();
    }
  };

  if (loading || !receiptData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading receipt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @page {
          margin: 0.5in;
          size: A4;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            box-shadow: none !important;
            margin: 0 !important;
          }
        }
      `}</style>
      
      {/* Print Button */}
      <div className="no-print p-4 text-center bg-white border-b flex justify-center gap-4">
        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Print Receipt
        </button>
        {onClose && (
          <button
            onClick={handleClose}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        )}
      </div>

      {/* Receipt Container */}
      <div className="flex justify-center p-4">
        <div className="print-container bg-white shadow-lg max-w-md w-full">
          {/* Header */}
          <div className="text-center border-b-2 border-dashed border-gray-300 p-6">
            <h1 className="text-xl font-bold text-gray-900 mb-1">{receiptData.businessName}</h1>
            <p className="text-sm text-gray-600">Payment Receipt</p>
            <div className="text-xs text-gray-500 mt-2">
              <p>{receiptData.businessContact}</p>
              {receiptData.businessAddress.map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </div>

          {/* Receipt Info */}
          <div className="p-6 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Receipt #:</span>
              <span className="font-medium text-gray-900">{receiptData.receiptNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Date & Time:</span>
              <span className="font-medium text-gray-900">{receiptData.date}</span>
            </div>
          </div>

          {/* Customer Details */}
          <div className="border-t border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Customer Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium text-gray-900">{receiptData.customer.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Mobile:</span>
                <span className="font-medium text-gray-900">{receiptData.customer.mobile}</span>
              </div>
              {receiptData.customer.email && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900 text-xs">{receiptData.customer.email}</span>
                </div>
              )}
              {receiptData.customer.address && (
                <div className="text-sm">
                  <span className="text-gray-600">Address:</span>
                  <p className="font-medium text-gray-900 mt-1">{receiptData.customer.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="border-t border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Payment Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Description:</span>
                <span className="font-medium text-gray-900">{receiptData.description}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount:</span>
                <span className="font-bold text-lg text-gray-900">₹{receiptData.payment.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment Mode:</span>
                <span className="font-medium text-gray-900">{receiptData.payment.paymentMode}</span>
              </div>
              {receiptData.payment.method && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Method:</span>
                  <span className="font-medium text-gray-900">{receiptData.payment.method}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-medium text-gray-900 text-xs">{receiptData.payment.transactionId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${
                  receiptData.payment.status === 'COMPLETED' ? 'text-green-600' : 
                  receiptData.payment.status === 'PENDING' ? 'text-yellow-600' : 
                  receiptData.payment.status === 'FAILED' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {receiptData.payment.status}
                </span>
              </div>
              {receiptData.payment.type && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium text-gray-900 capitalize">{receiptData.payment.type}</span>
                </div>
              )}
              {receiptData.payment.reference && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Reference:</span>
                  <span className="font-medium text-gray-900">{receiptData.payment.reference}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t-2 border-dashed border-gray-300 p-6 text-center">
            <p className="text-xs text-gray-500 mb-2">Thank you for your payment!</p>
            <p className="text-xs text-gray-400">This is a computer generated receipt.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceipt;
