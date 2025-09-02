import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface InvoiceItem {
  id: number;
  description: string;
  price: number;
  quantity: number;
  subtotal: number;
  discount?: number;
  originalAmount?: number;
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  supplier: {
    name: string;
    number: string;
    address: string[];
  };
  customer: {
    name: string;
    mobile: string;
    address: string[];
  };
  items: InvoiceItem[];
  pricing?: {
    subtotal: number;
    discount: number;
    discountPercentage: number;
    finalTotal: number;
  };
  transactionDetails: {
    transactionId: string;
    paymentMode: string;
    status: string;
    processedAt: string;
  };
  notes: string;
}

const Invoice: React.FC = () => {
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get payment data from localStorage
    const paymentDataStr = localStorage.getItem('invoice_payment');
    if (paymentDataStr) {
      try {
        const paymentData = JSON.parse(paymentDataStr);
        
        // Check if this is enhanced invoice data with multiple items and pricing
        if (paymentData.items && Array.isArray(paymentData.items)) {
          // Enhanced invoice data structure from Payments.tsx
          const transformedData: InvoiceData = {
            invoiceNumber: paymentData.invoiceNumber || `INV-${Date.now()}`,
            date: paymentData.date || format(new Date(), 'MMMM dd, yyyy'),
            supplier: paymentData.supplier || {
              name: "SmartPOS IMS",
              number: "IMS123456789",
              address: ["123 Business Street", "Commercial District", "Business City, 12345", "India"]
            },
            customer: paymentData.customer || {
              name: "Walk-in Customer",
              mobile: "N/A",
              address: ["Customer Address", "City, State", "India"]
            },
            items: paymentData.items,
            pricing: paymentData.pricing || undefined,
            transactionDetails: paymentData.transactionDetails || {
              transactionId: "N/A",
              paymentMode: "CASH",
              status: "COMPLETED",
              processedAt: format(new Date(), 'MMMM dd, yyyy HH:mm')
            },
            notes: paymentData.notes || "Invoice generated successfully."
          };
          setInvoiceData(transformedData);
        } else {
          // Legacy format - single payment data
          const transformedData: InvoiceData = {
            invoiceNumber: paymentData.invoiceNumber || paymentData.reference || paymentData.transactionId || `INV-${Date.now()}`,
            date: paymentData.date ? format(new Date(paymentData.date), 'MMMM dd, yyyy') : format(new Date(), 'MMMM dd, yyyy'),
            supplier: {
              name: "SmartPOS IMS",
              number: "IMS123456789",
              address: ["123 Business Street", "Commercial District", "Business City, 12345", "India"]
            },
            customer: {
              name: paymentData.customerName || paymentData.sale?.customer || "Walk-in Customer",
              mobile: paymentData.customerPhone || paymentData.phone || "N/A",
              address: ["Customer Address", "City, State", "India"]
            },
            items: [{
              id: 1,
              description: paymentData.sale?.product?.name || paymentData.description || "Payment Transaction",
              price: paymentData.amount || 0,
              quantity: paymentData.sale?.quantity || 1,
              subtotal: paymentData.amount || 0,
              discount: paymentData.sale?.discount || 0,
              originalAmount: paymentData.amount || 0
            }],
            transactionDetails: {
              transactionId: paymentData.transactionId || paymentData.reference || "N/A",
              paymentMode: (paymentData.paymentMode || 'cash').toUpperCase(),
              status: (paymentData.status || 'completed').toUpperCase(),
              processedAt: paymentData.date ? format(new Date(paymentData.date), 'MMMM dd, yyyy HH:mm') : format(new Date(), 'MMMM dd, yyyy HH:mm')
            },
            notes: `Payment processed via ${(paymentData.paymentMode || 'cash').toUpperCase()}. Transaction ID: ${paymentData.transactionId || 'N/A'}. Payment Type: ${(paymentData.paymentType || 'general').toUpperCase()}.`
          };
          setInvoiceData(transformedData);
        }
      } catch (error) {
        console.error('Error parsing payment data:', error);
        setDefaultInvoiceData();
      }
    } else {
      setDefaultInvoiceData();
    }
    setLoading(false);
  }, []);

  const setDefaultInvoiceData = () => {
    setInvoiceData({
      invoiceNumber: `INV-${Date.now()}`,
      date: format(new Date(), 'MMMM dd, yyyy'),
      supplier: {
        name: "SmartPOS IMS",
        number: "IMS123456789",
        address: ["123 Business Street", "Commercial District", "Business City, 12345", "India"]
      },
      customer: {
        name: "Sample Customer",
        mobile: "9999999999",
        address: ["Customer Address", "City, State", "Country"]
      },
      items: [{
        id: 1,
        description: "Sample Service",
        price: 1000.00,
        quantity: 1,
        subtotal: 1000.00,
        discount: 0,
        originalAmount: 1000.00
      }],
      transactionDetails: {
        transactionId: "SAMPLE-TXN-123",
        paymentMode: "CASH",
        status: "COMPLETED",
        processedAt: format(new Date(), 'MMMM dd, yyyy HH:mm')
      },
      notes: "This is a sample invoice. Please replace with actual payment data."
    });
  };

  const calculateNetTotal = (): number => {
    if (!invoiceData) return 0;
    
    // If we have pricing data with final total, use that
    if (invoiceData.pricing && invoiceData.pricing.finalTotal) {
      return invoiceData.pricing.finalTotal;
    }
    
    // Otherwise, sum up the subtotals from items
    return invoiceData.items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  if (loading || !invoiceData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @page {
          size: A4;
          margin: 20mm;
        }
        @media print {
          body { 
            margin: 0; 
            color: black !important;
            background: white !important;
          }
          .invoice-container { 
            max-width: none; 
            box-shadow: none;
            border: none;
          }
          .company-details {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 2rem !important;
          }
          .invoice-table {
            border-collapse: collapse !important;
          }
          .invoice-table th,
          .invoice-table td {
            border: 1px solid #ccc !important;
            padding: 8px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      
      {/* Print Button - Only visible on screen */}
      <div className="no-print fixed top-4 right-4 z-50">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg"
        >
          Print Invoice
        </button>
      </div>
      
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">SmartPOS IMS</h1>
            <p className="text-sm text-gray-500">Inventory Management System</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">Invoice</div>
            <div className="text-lg font-semibold text-gray-900">{invoiceData.invoiceNumber}</div>
            <div className="text-sm text-gray-500">{invoiceData.date}</div>
          </div>
        </div>

        <hr className="border-gray-200 mb-8" />

        {/* Company and Customer Details */}
        <div className="company-details grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">From</h3>
            <div className="text-sm text-gray-900">
              <p className="font-medium">{invoiceData.supplier.name}</p>
              <p>Number: {invoiceData.supplier.number}</p>
              {invoiceData.supplier.address.map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">To</h3>
            <div className="text-sm text-gray-900">
              <p className="font-medium">{invoiceData.customer.name}</p>
              <p>Mobile: {invoiceData.customer.mobile}</p>
              {invoiceData.customer.address.map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="mb-8">
          <table className="invoice-table w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">#</th>
                <th className="text-left py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">Description</th>
                <th className="text-right py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">Price</th>
                <th className="text-center py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">Qty</th>
                <th className="text-right py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-4 text-sm text-gray-900">{item.id}</td>
                  <td className="py-4 text-sm text-gray-900">{item.description}</td>
                  <td className="py-4 text-sm text-gray-900 text-right">₹{item.price.toFixed(2)}</td>
                  <td className="py-4 text-sm text-gray-900 text-center">{item.quantity}</td>
                  <td className="py-4 text-sm text-gray-900 text-right">₹{item.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {/* Subtotal before discount */}
              {invoiceData.pricing && invoiceData.pricing.discount > 0 && (
                <tr>
                  <td colSpan={4} className="py-2 text-right">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                  </td>
                  <td className="py-2 text-right">
                    <span className="text-sm text-gray-900">
                      ₹{invoiceData.pricing.subtotal.toFixed(2)}
                    </span>
                  </td>
                </tr>
              )}
              
              {/* Discount */}
              {invoiceData.pricing && invoiceData.pricing.discount > 0 && (
                <tr>
                  <td colSpan={4} className="py-2 text-right">
                    <span className="text-sm text-gray-600">
                      Discount ({invoiceData.pricing.discountPercentage.toFixed(1)}%):
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <span className="text-sm text-red-600">
                      -₹{invoiceData.pricing.discount.toFixed(2)}
                    </span>
                  </td>
                </tr>
              )}
              
              {/* Final Total */}
              <tr>
                <td colSpan={4} className="py-4 text-right border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-900">
                    {invoiceData.pricing && invoiceData.pricing.discount > 0 ? 'Final Total:' : 'Total:'}
                  </span>
                </td>
                <td className="py-4 text-right border-t border-gray-200">
                  <span className="text-lg font-semibold text-gray-900">
                    ₹{calculateNetTotal().toFixed(2)}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Transaction Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Transaction Details</h3>
            <div className="text-sm text-gray-900 space-y-1">
              <p><span className="font-medium">ID:</span> {invoiceData.transactionDetails.transactionId}</p>
              <p><span className="font-medium">Payment:</span> {invoiceData.transactionDetails.paymentMode}</p>
              <p><span className="font-medium">Status:</span> {invoiceData.transactionDetails.status}</p>
              <p><span className="font-medium">Processed:</span> {invoiceData.transactionDetails.processedAt}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-8 mt-12">
          <div className="text-center text-sm text-gray-500">
            <p>SmartPOS IMS</p>
            <p className="mt-1">
              <a href="mailto:info@smartpos.com" className="hover:text-gray-700">info@smartpos.com</a>
              <span className="mx-2">•</span>
              +91-9999999999
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;