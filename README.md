# ChiFere Cebu - Web-based Marketplace with Barter System

A modern web application for buying, selling, and bartering pre-loved items in Cebu, built with React and Firebase.

## 🚀 Features

- **User Authentication**: Secure login/registration for buyers and sellers
- **Item Management**: List, edit, and manage items with image uploads
- **Barter System**: Integrated bartering with offer management
- **Real-time Messaging**: Direct communication between buyers and sellers
- **Smart Notifications**: Real-time updates for messages, offers, and transactions
- **Search & Filters**: Advanced item search with category and price filtering
- **Responsive Design**: Mobile-first design for all devices

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion
- **Backend**: Firebase (Authentication, Firestore, Storage, Functions)
- **Real-time**: Firestore real-time listeners
- **Deployment**: Firebase Hosting

## 📋 Prerequisites

- Node.js 18+ and npm
- Firebase CLI (`npm install -g firebase-tools`)
- Google account for Firebase

## 🔧 Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd chifere-app
npm install
```

### 2. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication, Firestore, Storage, and Functions
4. Get your project configuration

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
VITE_FIREBASE_MEASUREMENT_ID=G-your_measurement_id_here
```

### 4. Firebase CLI Setup

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select your project and enable:
# - Firestore
# - Storage
# - Hosting
# - Emulators (for development)
```

### 5. Deploy Firebase Rules and Indexes

```bash
# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# Deploy Storage rules
firebase deploy --only storage
```

### 6. Start Development Environment

```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal, start the React app
npm run dev
```

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── pages/          # Page components
│   │   ├── Authentication/  # Login/Signup
│   │   ├── Buyer/          # Buyer-specific pages
│   │   ├── Seller/         # Seller-specific pages
│   │   └── Shared/         # Common components
│   └── ui/             # Reusable UI components
├── contexts/           # React contexts
├── services/           # Firebase service layer
│   ├── authService.js      # Authentication
│   ├── itemService.js      # Item management
│   ├── messagingService.js # Real-time messaging
│   └── notificationService.js # Notifications
├── config/             # Configuration files
│   └── firebase.js     # Firebase initialization
└── utils/              # Utility functions
```

## 🔐 Firebase Collections

### Users
- User profiles (buyers/sellers)
- Business information for sellers
- Verification status

### Items
- Product listings
- Images and descriptions
- Barter options and pricing
- Status tracking

### Conversations
- Direct messaging between users
- Item-specific conversations
- Real-time updates

### Messages
- Individual messages within conversations
- Support for text, images, and offers
- Read status tracking

### Notifications
- User notifications for various events
- Message, offer, and system notifications
- Priority and expiration handling

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
firebase deploy
```

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Start Firebase emulators
firebase emulators:start

# Deploy to Firebase
firebase deploy
```

## 📱 Features Implementation Status

### ✅ Completed
- Basic React frontend structure
- User authentication system
- Buyer dashboard and marketplace
- Basic item display and cart
- Landing page and navigation

### 🔄 In Progress
- Seller dashboard and item management
- Real-time messaging system
- Barter system implementation
- Payment integration

### 📋 Planned
- Advanced search and filtering
- User ratings and reviews
- Analytics dashboard
- Mobile app development

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the Firebase documentation

## 🔗 Useful Links

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite Documentation](https://vitejs.dev/)
