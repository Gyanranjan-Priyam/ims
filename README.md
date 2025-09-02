# SmartPOS IMS - Inventory Management System

A comprehensive Point of Sale (POS) and Inventory Management System built with modern web technologies. This system provides complete business management capabilities including inventory tracking, sales processing, payment management, and real-time notifications.

## 🚀 Features

### Core Functionality
- **Point of Sale (POS) System** - Complete checkout and sales processing
- **Inventory Management** - Real-time stock tracking and management
- **Sales Management** - Comprehensive sales reporting and analytics
- **Payment Processing** - Multiple payment methods with Razorpay integration
- **User Management** - Role-based access control (Admin, Manager, Salesperson)
- **Ledger Accounting** - Financial transaction tracking
- **Notification System** - Real-time alerts and updates

### Advanced Features
- **Barcode Scanner Integration** - Quick product lookup and checkout
- **Receipt Generation** - Professional invoice and receipt printing
- **Dashboard Analytics** - Real-time business insights and statistics
- **Multi-currency Support** - INR with extensible currency system
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Real-time Updates** - Live data synchronization across all sections

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks and context
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling framework
- **Vite** - Fast build tool and development server
- **Lucide React** - Beautiful icon library
- **Date-fns** - Date manipulation and formatting

### Backend
- **Node.js** - Server runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database for data storage
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication and authorization
- **Bcrypt** - Password hashing and security

### Payment Integration
- **Razorpay** - Payment gateway for online transactions
- **Multi-payment Support** - Cash, Online, Bank Transfer, Cheque


## 📱 Default Login Credentials

### Admin Account
- **Email:** `admin@test.com`
- **Password:** `admin123`


### Salesperson Account
- **Email:** `salesperson@test.com`
- **Password:** `salesperson123`

> **⚠️ Important:** Change these default credentials in production!

## 🎯 Usage Guide

### For Administrators
1. **Dashboard** - Monitor overall business performance
2. **User Management** - Create and manage user accounts
3. **Inventory Management** - Add, edit, and track products
4. **Sales Analytics** - View comprehensive sales reports
5. **System Settings** - Configure business parameters

### For Managers
1. **Inventory Control** - Manage stock levels and reorder points
2. **Sales Oversight** - Monitor daily sales and team performance
3. **Payment Tracking** - Review payment transactions
4. **Ledger Management** - Handle customer accounts and credits

### For Salespersons
1. **POS System** - Process customer transactions
2. **Product Lookup** - Search and scan products
3. **Payment Processing** - Handle cash and online payments
4. **Receipt Generation** - Print receipts and invoices

## 🗂️ Project Structure

```
IMS/
├── backend/                 # Node.js backend server
│   ├── models/             # Mongoose data models
│   ├── routes/             # API route handlers
│   ├── middleware/         # Custom middleware functions
│   ├── config/             # Database and app configuration
│   ├── .env                # Environment variables
│   ├── server.js           # Express server entry point
│   └── package.json        # Backend dependencies
│
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   ├── contexts/       # React context providers
│   │   ├── lib/           # Utility libraries and configs
│   │   ├── utils/         # Helper functions
│   │   └── assets/        # Static assets
│   ├── .env               # Frontend environment variables
│   ├── vite.config.ts     # Vite configuration
│   └── package.json       # Frontend dependencies
│
└── README.md              # Project documentation
```

## 🚀 Deployment

### Backend Deployment (Railway/Heroku/DigitalOcean)
1. Set environment variables on your hosting platform
2. Update MongoDB URI to production database
3. Deploy using your platform's deployment method

### Frontend Deployment (Vercel/Netlify)
1. Build the project: `npm run build`
2. Update `VITE_API_URL` to your production backend URL
3. Deploy the `dist` folder

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Email:web.gyanranjan@gmail.com (if applicable)

## 🎯 Roadmap

### Upcoming Features
- [ ] Multi-store support
- [ ] Advanced analytics and reporting
- [ ] Mobile application
- [ ] Barcode label printing
- [ ] Automated reorder alerts
- [ ] Customer loyalty program
- [ ] Integration with accounting software

---

**Built with ❤️ by Gyanranjan Priyam**
