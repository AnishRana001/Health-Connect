# 🩺 HealthConnect — Verified Doctor Appointment & Smart Scheduling Platform

HealthConnect is a full-stack healthcare appointment platform built using the MERN stack that allows patients to book appointments with verified doctors, manage prescriptions, make payments, and schedule appointments using smart slot availability.

## 🚀 Features

## 👤 Authentication & Role-Based Access
- Patient Login/Register  
- Doctor Login/Register  
- Admin Authentication  
- JWT-based Authentication  
- Role-based Protected Routes

---

## 🩺 Doctor Verification (KYC)
- Doctor registration with verification workflow  
- Admin approval/rejection system  
- Verification statuses:
  - Pending
  - Approved
  - Rejected

- Verified Doctor badge  
- Only verified doctors are visible to patients

---

## 📅 Smart Appointment Scheduling
- Slot-based appointment booking  
- Dynamic doctor availability  
- Prevents double booking  
- Book only free slots  
- Reserved slots during payment flow  
- Appointment confirmation workflow

---

## 💳 Payment Workflow (Mock Checkout)
- Simulated payment gateway  
- UPI / Card / Net Banking / Cash at Clinic  
- Payment confirmation before appointment confirmation  
- Payment status tracking

---

## 👨‍⚕️ Doctor Dashboard
- Manage doctor profile  
- Manage availability slots  
- View appointments  
- Issue prescriptions  
- Verification status banner

---

## 🛠 Admin Dashboard
- Doctor KYC approval management  
- User management  
- Appointment monitoring  
- Dashboard analytics

---

## 💊 Prescription Management
- Doctors can issue prescriptions  
- Patients can track medicines  
- Medicine schedule support

---

# 🏗 Tech Stack

## Frontend
- React  
- React Router  
- Axios  
- Context API  
- Lucide Icons  

## Backend
- Node.js  
- Express.js  
- MongoDB  
- Mongoose  
- JWT Authentication  
- Multer  
- Cloudinary

---

# 📂 Project Structure

```bash
HealthConnect/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── context/
│   └── utils/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── config/
```

---

# 🔄 Appointment Workflow

```text
Patient selects verified doctor
→ Select available slot
→ Slot reserved
→ Payment checkout
→ Appointment confirmed
→ Doctor consultation
→ Prescription issued
```

---

# 🔐 User Roles

## Patient
- Book appointments  
- Make payments  
- Track appointments  
- View prescriptions

## Doctor
- Manage profile  
- Set availability  
- Accept appointments  
- Issue prescriptions

## Admin
- Verify doctors  
- Manage users  
- Monitor appointments

---

# ⚙️ Installation

## Clone Repository
```bash
git clone https://github.com/AnishRana001/Health-Connect.git
cd Health-Connect
```

## Backend Setup
```bash
cd backend
npm install
npm start
```

## Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

# 🔑 Environment Variables


```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

# 🌟 Future Enhancements
- Real payment gateway integration  
- Video consultations  
- Notifications  
- Doctor ratings & reviews  
- AI symptom checker

---

# 📌 Key Highlights
✅ Doctor KYC Verification  
✅ Smart Slot Scheduling  
✅ Double Booking Prevention  
✅ Admin Dashboard  
✅ Payment Workflow  
✅ Role-Based Access Control  

---

# 👨‍💻 Author
Anish Rana

GitHub: https://github.com/AnishRana001

---

## ⭐ If you like this project, give it a star!
