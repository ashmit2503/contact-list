# 📇 Contact Manager

A modern, full-stack contact management application with user authentication and import/export functionality.

## ✨ Features

- **User Authentication** - Secure login and registration with JWT
- **Contact Management** - Add, edit, view, and delete contacts
- **Import/Export** - Import and export contacts in VCF format
- **Bulk Operations** - Select and delete multiple contacts at once
- **Phone Validation** - International phone number support with country codes
- **Email Support** - Optional email field for contacts
- **Dark Mode** - Toggle between light and dark themes
- **Search** - Quickly find contacts by name, phone, or email
- **Responsive Design** - Works seamlessly on desktop and mobile

## 🛠️ Tech Stack

**Frontend**
- React 19
- Vite
- CSS3

**Backend**
- Node.js + Express
- Vercel Postgres
- JWT Authentication
- bcrypt for password hashing

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd contact-list
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

   The app will be available at:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

### Deploy to Production

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login and deploy**
   ```bash
   vercel login
   vercel --prod
   ```

3. **Setup Database**
   - Go to your Vercel project dashboard
   - Navigate to Storage tab
   - Create a new Postgres database
   - Connect it to your project

4. **Add Environment Variables**
   - In Vercel project settings, add:
   - `JWT_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

## 📁 Project Structure

```
contact-list/
├── api/                    # Backend API (serverless)
│   ├── index.js           # API routes
│   └── db-postgres.js     # Database operations
├── src/
│   ├── components/        # React components
│   ├── utils/            # Helper functions and API client
│   └── *.jsx             # Main app files
├── public/               # Static assets
└── vercel.json           # Vercel configuration
```

## 🔧 Available Scripts

```bash
npm run dev       # Run frontend + backend
npm run build     # Build for production
npm run preview   # Preview production build
npm run server    # Run backend only
npm run client    # Run frontend only
```

## 🎯 Usage

1. **Register/Login** - Create an account or sign in
2. **Add Contacts** - Click the + button to add new contacts
3. **Import Contacts** - Import existing contacts from VCF files
4. **Export Contacts** - Select contacts and export to VCF format
5. **Edit/Delete** - Click on any contact to view details and manage it
6. **Toggle Theme** - Use the theme button in the navbar

---

**Built with ❤️ using React and Vercel**

