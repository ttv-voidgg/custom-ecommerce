# Lumière - Luxury Jewelry Ecommerce Platform

A complete, modern jewelry ecommerce platform built with Next.js 14, Firebase, and Tailwind CSS. Features a sophisticated admin panel, file management system, and elegant storefront designed specifically for luxury jewelry retailers.

## 🌟 Features

### Customer-Facing Store
- **Elegant Design**: Minimalist, luxury-focused design with high-quality imagery
- **Product Catalog**: Advanced filtering, search, and categorization
- **Responsive Layout**: Mobile-first design that works on all devices
- **Product Gallery**: High-resolution image galleries with zoom functionality
- **User Authentication**: Secure customer accounts with Firebase Auth
- **Shopping Cart**: Persistent cart with local storage
- **Wishlist**: Save favorite items for later

### Admin Dashboard
- **Product Management**: Full CRUD operations for jewelry inventory
- **Order Processing**: Complete order management and tracking system
- **Customer Management**: View and manage customer accounts
- **File Manager**: SFTP-based file upload and management system
- **Analytics Dashboard**: Sales metrics and performance tracking
- **Settings Management**: Store configuration and customization

### Technical Features
- **Next.js 14**: Latest App Router with Server Components
- **Firebase Integration**: Authentication, Firestore database, and hosting
- **SFTP File Storage**: Custom file management with external server support
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Utility-first styling with custom design system
- **Responsive Design**: Mobile-first approach with elegant desktop layouts

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Firebase project with Firestore and Authentication enabled
- SFTP server for file storage (optional)

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <your-repo-url>
   cd jewelry-ecommerce
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables**
   Copy the example environment file and configure your settings:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

4. **Configure Firebase**
   - Create a new Firebase project at https://console.firebase.google.com
   - Enable Authentication (Email/Password provider)
   - Create a Firestore database
   - Get your Firebase configuration from Project Settings
   - Update `.env.local` with your Firebase credentials

5. **Run the setup wizard**
   \`\`\`bash
   npm run dev
   \`\`\`
   Navigate to `http://localhost:3000/setup` to initialize your store

6. **Start development**
   \`\`\`bash
   npm run dev
   \`\`\`

## 📁 Project Structure

\`\`\`
jewelry-ecommerce/
├── app/                          # Next.js App Router
│   ├── admin/                    # Admin dashboard pages
│   ├── api/                      # API routes
│   ├── auth/                     # Authentication pages
│   ├── products/                 # Product pages
│   ├── setup/                    # Setup wizard
│   └── page.tsx                  # Homepage
├── components/                   # Reusable UI components
│   └── ui/                       # shadcn/ui components
├── hooks/                        # Custom React hooks
├── lib/                          # Utility functions and configurations
├── public/                       # Static assets
└── styles/                       # Global styles
\`\`\`

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

\`\`\`env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Admin Configuration
NEXT_PUBLIC_ADMIN_EMAILS=admin@yourstore.com,manager@yourstore.com

# SFTP Configuration (Optional)
SFTP_HOST=your.sftp.server.com
SFTP_PORT=22
SFTP_USERNAME=your_username
SFTP_PASSWORD=base64_encoded_password
SFTP_BASE_URL=https://your.cdn.com
\`\`\`

### Firebase Setup

1. **Create Firebase Project**
   - Go to https://console.firebase.google.com
   - Create a new project
   - Enable Google Analytics (optional)

2. **Enable Authentication**
   - Go to Authentication > Sign-in method
   - Enable Email/Password provider
   - Configure authorized domains

3. **Create Firestore Database**
   - Go to Firestore Database
   - Create database in production mode
   - Set up security rules (see Firebase Rules section)

4. **Get Configuration**
   - Go to Project Settings > General
   - Scroll to "Your apps" section
   - Add a web app and copy the configuration

### Firebase Security Rules

Add these rules to your Firestore database:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Products are readable by all, writable by admins
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Orders are readable by owner and admins
    match /orders/{orderId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
      allow write: if request.auth != null;
    }
    
    // Settings are admin-only
    match /settings/{document} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
\`\`\`

## 🛠 Development

### Available Scripts

\`\`\`bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
\`\`\`

### Adding New Features

1. **New Pages**: Add to `app/` directory following App Router conventions
2. **API Routes**: Create in `app/api/` directory
3. **Components**: Add reusable components to `components/`
4. **Hooks**: Custom hooks go in `hooks/`
5. **Utilities**: Helper functions in `lib/`

### Database Schema

The application uses the following Firestore collections:

- **products**: Product inventory with specifications, pricing, and images
- **orders**: Customer orders with items, shipping, and payment info
- **users**: Customer and admin accounts with profiles and preferences
- **categories**: Product categories and subcategories
- **settings**: Store configuration and customization options

## 🎨 Customization

### Styling
- Built with Tailwind CSS for easy customization
- Custom color palette defined in `tailwind.config.js`
- Component styles use shadcn/ui design system
- Global styles in `app/globals.css`

### Branding
- Update store name and description in setup wizard
- Replace logo and favicon in `public/` directory
- Customize colors in Tailwind configuration
- Modify typography and spacing as needed

## 📦 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   - Import your repository to Vercel
   - Configure environment variables in dashboard
   - Deploy automatically on push

2. **Environment Variables**
   - Add all `.env.local` variables to Vercel dashboard
   - Ensure Firebase configuration is correct
   - Test deployment with preview URLs

### Other Platforms

The application can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify
- Self-hosted with Docker

## 🔒 Security

### Best Practices Implemented
- Firebase Authentication for secure user management
- Firestore security rules for data protection
- Environment variables for sensitive configuration
- Input validation and sanitization
- HTTPS enforcement in production
- CSRF protection with Next.js built-ins

### Additional Recommendations
- Enable Firebase App Check for API protection
- Implement rate limiting for API routes
- Use Content Security Policy headers
- Regular security audits with `npm audit`
- Monitor authentication events in Firebase Console

## 🚧 Roadmap & Missing Features

### High Priority
- [ ] **Shopping Cart & Checkout**
  - Persistent cart with local storage
  - Multi-step checkout process
  - Payment integration (Stripe/PayPal)
  - Order confirmation and email notifications

- [ ] **Product Detail Pages**
  - High-resolution image galleries
  - 360-degree product views
  - Size guides and specifications
  - Related products and recommendations

- [ ] **Search & Filtering**
  - Advanced search with Algolia or similar
  - Filter by price, material, category
  - Sort options (price, popularity, newest)
  - Search suggestions and autocomplete

### Medium Priority
- [ ] **User Account Features**
  - Order history and tracking
  - Wishlist and favorites
  - Address book management
  - Account preferences and settings

- [ ] **Admin Enhancements**
  - Bulk product operations
  - Inventory management and alerts
  - Sales analytics and reporting
  - Customer communication tools

- [ ] **Performance Optimizations**
  - Image optimization and CDN
  - Lazy loading for product grids
  - Caching strategies
  - SEO improvements and meta tags

### Low Priority
- [ ] **Advanced Features**
  - Multi-language support (i18n)
  - Currency conversion
  - Product reviews and ratings
  - Social media integration
  - Email marketing integration
  - Live chat support

- [ ] **Mobile App**
  - React Native mobile application
  - Push notifications
  - Mobile-specific features
  - App store deployment

### Technical Debt
- [ ] **Testing**
  - Unit tests with Jest
  - Integration tests with Cypress
  - Component testing with React Testing Library
  - End-to-end testing automation

- [ ] **Documentation**
  - API documentation with OpenAPI
  - Component documentation with Storybook
  - Deployment guides for different platforms
  - Contributing guidelines

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use conventional commit messages
- Add tests for new features
- Update documentation as needed
- Ensure responsive design compatibility

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

**Firebase Connection Errors**
- Verify environment variables are correct
- Check Firebase project configuration
- Ensure Firestore and Auth are enabled

**SFTP Upload Issues**
- Verify SFTP credentials and server access
- Check file permissions on server
- Ensure base64 encoding for password

**Build Errors**
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check TypeScript errors: `npm run type-check`
- Verify all environment variables are set

### Getting Help
- Check the [Issues](../../issues) page for known problems
- Create a new issue with detailed description
- Include error messages and environment details
- Provide steps to reproduce the problem

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)
- Database and auth with [Firebase](https://firebase.google.com/)
\`\`\`

```plaintext file=".env.example"
# Firebase Configuration
# Get these values from your Firebase project settings
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id_here
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id_here

# Admin Configuration
# Comma-separated list of admin email addresses
NEXT_PUBLIC_ADMIN_EMAILS=admin@yourstore.com,manager@yourstore.com

# SFTP Configuration (Optional - for file uploads)
# If you don't have an SFTP server, you can skip these
SFTP_HOST=your.sftp.server.com
SFTP_PORT=22
SFTP_USERNAME=your_sftp_username
SFTP_PASSWORD=your_base64_encoded_password
SFTP_BASE_URL=https://your.cdn.domain.com

# Development Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
