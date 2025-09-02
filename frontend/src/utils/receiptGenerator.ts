interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface ReceiptData {
  storeInfo?: {
    name: string;
    address: string;
    phone: string;
    email?: string;
  };
  transactionId?: string;
  invoiceNo?: string;
  cashier?: string;
  customer?: string;
  customerPhone?: string;
  items?: ReceiptItem[];
  paymentMethod?: string;
  discount?: number;
  date?: Date;
  paymentAmount?: number; // For payment receipts
}

export const generateReceiptHTML = (data: ReceiptData): string => {
  const {
    storeInfo = {
      name: "SmartPOS Store",
      address: "123 Business Street, Downtown, NY 10001",
      phone: "(555) 123-4567",
      email: "info@smartpos.com"
    },
    transactionId = "TXN-2025-090201",
    invoiceNo,
    cashier = "Salesperson",
    customer = "Walk-in Customer",
    customerPhone = "N/A",
    items = [],
    paymentMethod = "Cash",
    discount = 0,
    date = new Date(),
    paymentAmount
  } = data;

  const isPaymentReceipt = items.length === 0 && paymentAmount;
  const subtotal = isPaymentReceipt ? paymentAmount : items.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = (subtotal * discount) / 100;
  const taxRate = 0.08; // 8% tax rate
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * taxRate;
  const totalAmount = taxableAmount + taxAmount;
  
  const receiptDate = date.toLocaleDateString();
  const receiptTime = date.toLocaleTimeString();

  return `
    <!-- Store Header -->
    <div class="text-center mb-4 pb-4 border-b border-gray-400">
      <h1 class="text-lg font-bold mb-2">${storeInfo.name}</h1>
      <p class="text-xs leading-relaxed">${storeInfo.address}</p>
      <p class="text-xs">${storeInfo.phone}</p>
      ${storeInfo.email ? `<p class="text-xs">${storeInfo.email}</p>` : ''}
    </div>

    <!-- Transaction Info -->
    <div class="mb-4 text-xs">
      <div class="flex justify-between">
        <span>Date: ${receiptDate}</span>
        <span>Time: ${receiptTime}</span>
      </div>
      ${invoiceNo ? `
      <div class="flex justify-between mt-1">
        <span>Invoice: ${invoiceNo}</span>
      </div>` : ''}
      <div class="flex justify-between mt-1">
        <span>Transaction: ${transactionId}</span>
      </div>
      <div class="flex justify-between mt-1">
        <span>Cashier: ${cashier}</span>
      </div>
      ${customer !== "Walk-in Customer" ? `
      <div class="flex justify-between mt-1">
        <span>Customer: ${customer}</span>
      </div>
      ${customerPhone !== "N/A" ? `
      <div class="flex justify-between mt-1">
        <span>Phone: ${customerPhone}</span>
      </div>` : ''}` : ''}
      ${isPaymentReceipt ? `
      <div class="flex justify-between mt-1">
        <span><strong>PAYMENT RECEIPT</strong></span>
      </div>` : ''}
    </div>

    ${!isPaymentReceipt ? `
    <!-- Items -->
    <div class="mb-4 pb-4 border-b border-gray-400">
      <div class="flex justify-between text-xs font-bold mb-2">
        <span>ITEM</span>
        <span>QTY × PRICE = TOTAL</span>
      </div>
      
      ${items.map((item) => `
        <div class="mb-2">
          <div class="text-xs">${item.name}</div>
          <div class="flex justify-between text-xs">
            <span></span>
            <span>
              ${item.quantity} × ₹${item.price.toFixed(2)} = ₹${item.total.toFixed(2)}
            </span>
          </div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- Totals -->
    <div class="mb-4 text-xs">
      ${!isPaymentReceipt ? `
      <div class="flex justify-between mb-1">
        <span>Subtotal:</span>
        <span>₹${subtotal.toFixed(2)}</span>
      </div>
      ${discount > 0 ? `
      <div class="flex justify-between mb-1">
        <span>Discount (${discount}%):</span>
        <span>-₹${discountAmount.toFixed(2)}</span>
      </div>` : ''}
      <div class="flex justify-between mb-1">
        <span>Tax (8%):</span>
        <span>₹${taxAmount.toFixed(2)}</span>
      </div>` : ''}
      <div class="flex justify-between font-bold text-base border-t border-gray-400 pt-2">
        <span>${isPaymentReceipt ? 'PAYMENT AMOUNT:' : 'TOTAL:'}</span>
        <span>₹${(isPaymentReceipt ? paymentAmount : totalAmount).toFixed(2)}</span>
      </div>
    </div>

    <!-- Payment Info -->
    <div class="mb-4 text-xs border-t border-gray-400 pt-2">
      <div class="flex justify-between">
        <span>Payment Method:</span>
        <span>${paymentMethod}</span>
      </div>
      <div class="flex justify-between">
        <span>Amount Paid:</span>
        <span>₹${(isPaymentReceipt ? paymentAmount : totalAmount).toFixed(2)}</span>
      </div>
      <div class="flex justify-between">
        <span>Change:</span>
        <span>₹0.00</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="text-center text-xs border-t border-gray-400 pt-4">
      <p class="mb-2">Thank you for shopping with us!</p>
      <p class="mb-1">Return Policy: 30 days with receipt</p>
      <p class="mb-1">Customer Service: (555) 123-4567</p>
      <div class="mt-4 text-center">
        <div class="inline-block bg-black text-white px-2 py-1 font-mono text-xs">
          |||||| |||| |||||| |||||| ||||||
        </div>
        <p class="text-xs mt-1">${transactionId}</p>
      </div>
    </div>
  `;
};

export const printReceipt = (data: ReceiptData) => {
  const receiptHTML = generateReceiptHTML(data);
  const transactionId = data.transactionId || "TXN-2025-090201";
  
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    // Create the print document with exact styling
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${transactionId}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              background: white;
              color: black;
            }
            .receipt-container {
              max-width: 384px; /* 24rem equivalent */
              margin: 0 auto;
              background: white;
              padding: 24px; /* 1.5rem */
              font-family: 'Courier New', monospace;
              font-size: 14px;
              border: 1px solid #d1d5db;
              box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
            }
            
            /* Utility Classes */
            .text-center { text-align: center; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-1 { margin-bottom: 0.25rem; }
            .mt-1 { margin-top: 0.25rem; }
            .mt-4 { margin-top: 1rem; }
            .pb-4 { padding-bottom: 1rem; }
            .pt-2 { padding-top: 0.5rem; }
            .pt-4 { padding-top: 1rem; }
            .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
            .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
            
            .text-lg { font-size: 18px; line-height: 28px; }
            .text-base { font-size: 16px; line-height: 24px; }
            .text-xs { font-size: 12px; line-height: 16px; }
            .font-bold { font-weight: 700; }
            .font-medium { font-weight: 500; }
            .font-mono { font-family: 'Courier New', monospace; }
            .leading-relaxed { line-height: 1.625; }
            
            .border-b { border-bottom: 1px solid #9ca3af; }
            .border-t { border-top: 1px solid #9ca3af; }
            .border-gray-400 { border-color: #9ca3af; }
            
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .items-center { align-items: center; }
            
            .inline-block { display: inline-block; }
            .bg-black { background-color: black; }
            .text-white { color: white; }
            
            @media print {
              body {
                margin: 0;
                padding: 0;
                font-size: 12px;
              }
              .receipt-container {
                max-width: none;
                border: none;
                box-shadow: none;
                margin: 0;
                padding: 10px;
              }
              .text-lg { font-size: 16px; }
              .text-base { font-size: 14px; }
              .text-xs { font-size: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            ${receiptHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
};
