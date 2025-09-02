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

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn** package manager
- **MongoDB** (local installation or MongoDB Atlas)
- **Git** for version control

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd IMS
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/smartpos_ims
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/smartpos_ims

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here

# Server Configuration
PORT=5000
NODE_ENV=development

# Razorpay Configuration (Optional for payment features)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Create a `.env` file in the frontend directory:

**For Local Development:**
```env
# Development API URL (local development)
VITE_API_URL=http://localhost:5000

# Razorpay Configuration
VITE_RAZORPAY_KEY_ID=rzp_test_RA04Y5v6BCVxAl

# Development settings
VITE_NODE_ENV=development
```

**For Production Deployment:**
```env
# Production API URL (deployed backend)
VITE_API_URL=https://ims-z37w.onrender.com

# Razorpay Configuration
VITE_RAZORPAY_KEY_ID=rzp_test_RA04Y5v6BCVxAl

# Production settings
VITE_NODE_ENV=production
```

### 4. Database Setup
Make sure MongoDB is running on your system:

**For Local MongoDB:**
```bash
mongod
```

**For MongoDB Atlas:**
- Create a cluster on [MongoDB Atlas](https://cloud.mongodb.com/)
- Get your connection string
- Update the `MONGODB_URI` in your backend `.env` file

## 🏃‍♂️ Running the Application

### Development Mode

1. **Start the Backend Server:**
```bash
cd backend
npm run dev
```
Server will run on `http://localhost:5000`

2. **Start the Frontend Development Server:**
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:5173`

### Production Mode

1. **Build the Frontend:**
```bash
cd frontend
npm run build
```

2. **Start the Backend in Production:**
```bash
cd backend
npm start
```

## 📱 Default Login Credentials

### Admin Account
- **Email:** `admin@smartpos.com`
- **Password:** `admin123`

### Manager Account
- **Email:** `manager@smartpos.com`
- **Password:** `manager123`

### Salesperson Account
- **Email:** `sales@smartpos.com`
- **Password:** `sales123`

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

## 🔌 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/me` - Get current user info

### Products & Inventory
- `GET /products` - Get all products
- `POST /products` - Create new product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product

### Sales Management
- `GET /sales` - Get all sales
- `POST /sales` - Create new sale
- `GET /sales/stats` - Get sales statistics

### Payment Processing
- `GET /payments` - Get all payments
- `POST /payments` - Process payment
- `POST /payments/create-order` - Create Razorpay order

### User Management
- `GET /users` - Get all users (Admin only)
- `POST /users` - Create new user (Admin only)
- `PUT /users/:id` - Update user (Admin only)

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
- `MONGODB_URI` - Database connection string
- `JWT_SECRET` - JWT signing secret
- `PORT` - Server port (default: 5000)
- `RAZORPAY_KEY_ID` - Razorpay public key
- `RAZORPAY_KEY_SECRET` - Razorpay secret key

**Frontend (.env):**
- `VITE_API_URL` - Backend API URL
- `VITE_RAZORPAY_KEY_ID` - Razorpay public key for frontend
- `VITE_NODE_ENV` - Environment mode

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
- Email: support@smartpos.com (if applicable)
- Documentation: Check the `/docs` folder for detailed guides

## 🎯 Roadmap

### Upcoming Features
- [ ] Multi-store support
- [ ] Advanced analytics and reporting
- [ ] Mobile application
- [ ] Barcode label printing
- [ ] Automated reorder alerts
- [ ] Customer loyalty program
- [ ] Integration with accounting software

## 📊 Screenshots

### Dashboard
![Dashboard Screenshot](docs/screenshots/dashboard.png)

### POS System
![POS Screenshot](docs/screenshots/pos.png)

### Inventory Management
![Inventory Screenshot](docs/screenshots/inventory.png)

---

**Built with ❤️ by the SmartPOS Team**

For more information, visit our [documentation](docs/) or check out the [API documentation](docs/api.md).
