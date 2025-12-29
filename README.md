# Digital Health Wallet

A comprehensive Digital Health Wallet application that allows users to securely store, manage, and share their medical reports and vital health data. Users can upload reports via web, retrieve them based on various criteria, track vital trends over time, and grant controlled access to family members, doctors, or friends.

## 🎯 Features

### Core Functionality

- **User Management**
  - User registration and authentication
  - JWT-based secure authentication
  - Password hashing with bcrypt

- **Health Reports Management**
  - Upload medical reports (PDF/Image formats)
  - Store metadata (report type, date, associated vitals)
  - View and download uploaded reports
  - Delete reports
  - Filter reports by date, type, or vital type

- **Vitals Tracking**
  - Store multiple vital parameters:
    - Blood Pressure (Systolic/Diastolic)
    - Blood Sugar (Fasting/Postprandial)
    - Heart Rate
    - Temperature
    - Weight & Height
    - Cholesterol
  - Visualize trends over time with interactive charts
  - Filter vitals by date range

- **Access Control & Sharing**
  - Share specific reports with other users
  - Define access roles (Viewer/Editor)
  - View reports shared with you
  - Manage and revoke shared access

## 🛠️ Technology Stack

### Frontend
- **ReactJS** - UI framework
- **React Router** - Navigation and routing
- **Axios** - HTTP client for API calls
- **Recharts** - Chart library for vitals visualization

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload handling

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)
- **Git** (for version control)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd digital-health-wallet
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Install Frontend Dependencies

```bash
cd client
npm install
cd ..
```

### 4. Initialize Database

The database will be automatically created when you start the server for the first time. The SQLite database file (`health_wallet.db`) will be created in the root directory.

### 5. Start the Application

#### Option A: Run Backend and Frontend Separately

**Terminal 1 - Start Backend Server:**
```bash
npm start
```
The backend server will run on `http://localhost:5000`

**Terminal 2 - Start Frontend:**
```bash
cd client
npm start
```
The frontend will run on `http://localhost:3000` and automatically open in your browser.

#### Option B: Run Both (Development)

You'll need to run both servers in separate terminal windows/tabs as described above.

## 📁 Project Structure

```
digital-health-wallet/
├── client/                      # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── UploadReport.js
│   │   │   ├── VitalsChart.js
│   │   │   └── ShareAccess.js
│   │   ├── services/           # API service layer
│   │   │   └── api.js
│   │   ├── App.js              # Main app component
│   │   └── index.js
│   └── package.json
├── routes/                      # Express routes
│   ├── users.js                # User authentication routes
│   ├── reports.js              # Report management routes
│   ├── vitals.js               # Vitals management routes
│   └── shares.js               # Access sharing routes
├── middleware/                  # Express middleware
│   └── auth.js                 # JWT authentication middleware
├── uploads/                     # Uploaded files storage (created automatically)
├── database.js                  # Database initialization and schema
├── index.js                     # Express server entry point
├── package.json
└── README.md
```

## 🔌 API Documentation

### Authentication Endpoints

#### POST `/api/users/register`
Register a new user.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

#### POST `/api/users/login`
Login user.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "password123"
}
```

#### GET `/api/users/me`
Get current user information (requires authentication).

### Reports Endpoints

#### POST `/api/reports/upload`
Upload a new health report (requires authentication, multipart/form-data).

**Form Data:**
- `report`: File (PDF or Image)
- `reportType`: String (e.g., "Blood Test", "X-Ray")
- `date`: String (ISO date format)
- `vitals`: JSON string (optional)

#### GET `/api/reports`
Get all reports for authenticated user.

**Query Parameters:**
- `date`: Filter by date
- `reportType`: Filter by report type
- `vitalType`: Filter by vital type

#### GET `/api/reports/:id`
Get specific report by ID.

#### GET `/api/reports/:id/download`
Download report file.

#### DELETE `/api/reports/:id`
Delete a report.

#### GET `/api/reports/shared`
Get reports shared with the authenticated user.

### Vitals Endpoints

#### POST `/api/vitals`
Create a new vitals entry.

**Request Body:**
```json
{
  "reportId": 1,
  "bloodPressureSystolic": 120,
  "bloodPressureDiastolic": 80,
  "bloodSugarFasting": 95,
  "heartRate": 72,
  "date": "2024-01-15"
}
```

#### GET `/api/vitals`
Get all vitals for authenticated user.

**Query Parameters:**
- `startDate`: Start date for filtering
- `endDate`: End date for filtering
- `vitalType`: Type of vital to filter

#### GET `/api/vitals/trends`
Get vitals data formatted for charting.

**Query Parameters:**
- `startDate`: Start date
- `endDate`: End date
- `vitalType`: Type of vital (blood_pressure, blood_sugar, heart_rate, etc.)

### Sharing Endpoints

#### POST `/api/shares/:reportId`
Share a report with another user.

**Request Body:**
```json
{
  "sharedWithEmail": "doctor@example.com",
  "role": "viewer"
}
```

#### GET `/api/shares/report/:reportId`
Get all shares for a specific report.

#### GET `/api/shares/shared-with-me`
Get all reports shared with the authenticated user.

#### DELETE `/api/shares/:shareId`
Revoke share access.

## 🔐 Security Features

- **Password Hashing**: Passwords are hashed using bcrypt before storage
- **JWT Authentication**: Secure token-based authentication
- **File Validation**: File type and size validation on upload
- **Access Control**: Role-based access control for shared reports
- **Protected Routes**: All sensitive endpoints require authentication

## 🏗️ Database Schema

### Users Table
- `id`: Primary key
- `username`: Unique username
- `email`: Unique email
- `password`: Hashed password
- `created_at`: Timestamp

### Reports Table
- `id`: Primary key
- `user_id`: Foreign key to users
- `filename`: Stored filename
- `original_filename`: Original filename
- `file_type`: File extension
- `report_type`: Type of report
- `date`: Report date
- `created_at`: Timestamp

### Vitals Table
- `id`: Primary key
- `user_id`: Foreign key to users
- `report_id`: Foreign key to reports (optional)
- Various vital fields (blood_pressure_systolic, blood_pressure_diastolic, etc.)
- `date`: Date of measurement
- `created_at`: Timestamp

### Access Shares Table
- `id`: Primary key
- `report_id`: Foreign key to reports
- `owner_id`: Foreign key to users (owner)
- `shared_with_user_id`: Foreign key to users (recipient)
- `shared_with_email`: Email of recipient
- `role`: Access role (viewer/editor)
- `created_at`: Timestamp

## 🎨 System Architecture

```
┌─────────────────┐
│   React Client  │
│   (Port 3000)   │
└────────┬────────┘
         │
         │ HTTP/REST API
         │
┌────────▼────────┐
│  Express Server │
│   (Port 5000)   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼─────┐
│SQLite │ │ Uploads│
│  DB   │ │ Folder │
└───────┘ └────────┘
```

### Frontend Architecture
- **Components**: Modular React components for different features
- **Services**: Centralized API service layer using Axios
- **Routing**: React Router for navigation
- **State Management**: React Hooks (useState, useEffect)

### Backend Architecture
- **RESTful API**: RESTful endpoints for all operations
- **Middleware**: Authentication middleware for protected routes
- **File Storage**: Local filesystem storage (can be migrated to cloud)
- **Database**: SQLite for data persistence

## 🧪 Testing the Application

1. **Register a new user**
   - Navigate to Register page
   - Fill in username, email, and password
   - Submit to create account

2. **Upload a report**
   - Login and go to Dashboard
   - Click "Upload Report"
   - Select a PDF or image file
   - Fill in report details and optional vitals
   - Submit

3. **View vitals trends**
   - Go to "Vitals Trends" tab
   - Select a vital type
   - Optionally set date range
   - View interactive charts

4. **Share a report**
   - In the Reports tab, click "Share" on any report
   - Enter email of the user to share with
   - Select access level (Viewer/Editor)
   - Submit

5. **View shared reports**
   - Switch to "Shared With Me" tab
   - View all reports shared with you

## 🔮 Future Enhancements

- **Cloud Storage**: Migrate file storage to AWS S3 or similar
- **Mobile App**: React Native mobile application
- **WhatsApp Integration**: Upload reports via WhatsApp
- **Email Notifications**: Notify users when reports are shared
- **Advanced Analytics**: More detailed health insights and recommendations
- **Export Functionality**: Export reports and vitals as PDF
- **Multi-language Support**: Support for multiple languages
- **Two-Factor Authentication**: Enhanced security

## 📝 Notes

- The SQLite database file (`health_wallet.db`) is created automatically on first run
- Uploaded files are stored in the `uploads/` directory
- JWT tokens expire after 24 hours
- Maximum file upload size is 10MB
- Supported file types: PDF, JPEG, PNG, GIF

## 👨‍💻 Development

### Environment Variables

Create a `.env` file in the root directory for production:

```
JWT_SECRET=your-secret-key-here
PORT=5000
REACT_APP_API_URL=http://localhost:5000/api
```

### Code Structure

- Follow React best practices for component structure
- Use async/await for API calls
- Implement proper error handling
- Follow RESTful API conventions

## 📄 License

This project is created for educational purposes as part of the 2care.ai assignment.
