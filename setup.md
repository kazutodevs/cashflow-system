# 🚀 CashFlow System - Quick Start Guide

## Step 1: Prepare Your Environment

### Create `.env.local` file in project root:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### Get these from Supabase:
1. Go to https://supabase.com
2. Create new project
3. Settings → API → Copy Project URL and anon key

## Step 2: Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## Step 3: Database Setup

Copy and run this SQL in Supabase SQL Editor:

```sql
-- Students
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  email VARCHAR UNIQUE,
  class_name VARCHAR DEFAULT 'XI TKJ A',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  username VARCHAR NOT NULL UNIQUE,
  password VARCHAR NOT NULL,
  role VARCHAR DEFAULT 'user',
  token VARCHAR UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  amount DECIMAL NOT NULL,
  category VARCHAR,
  description TEXT,
  proof_image_url VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Income
CREATE TABLE income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  amount DECIMAL NOT NULL,
  source VARCHAR,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment Status
CREATE TABLE payment_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  month INT NOT NULL,
  year INT DEFAULT 2026,
  paid BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Financial Summary
CREATE TABLE financial_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_cash DECIMAL DEFAULT 0,
  mini_bank DECIMAL DEFAULT 0,
  treasurer DECIMAL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR CHECK (type IN ('income', 'expense')),
  name VARCHAR NOT NULL,
  amount DECIMAL NOT NULL,
  category VARCHAR,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Step 4: Create Storage Bucket

1. Go to Supabase → Storage
2. Click "Create new bucket"
3. Name: `expense-proofs`
4. Make public or configure RLS

## Step 5: Add Sample Data

Insert sample students to test login:

```sql
INSERT INTO students (name, email) VALUES
('Ahmad Rizki', 'ahmad@tkja.com'),
('Budi Santoso', 'budi@tkja.com'),
('Citra Dewi', 'citra@tkja.com'),
('Doni Pratama', 'doni@tkja.com'),
('Eka Putri', 'eka@tkja.com');

-- Get student IDs and create users
-- Replace student_ids with actual UUIDs from students table
INSERT INTO users (student_id, username, password, role) VALUES
('student-id-1', 'ahmad', 'password123', 'user'),
('student-id-2', 'budi', 'password123', 'user'),
('student-id-3', 'admin', 'admin123', 'admin');
```

## Step 6: Test Login

- **Student Login**: Select "Ahmad Rizki", password: "password123"
- **Admin Login**: Select "Admin", password: "admin123"

## Step 7: Deploy to Vercel

```bash
npm run build
vercel deploy
```

Or connect GitHub repo to Vercel and set environment variables.

## 🎯 Features to Try

### As User:
- ✅ View dashboard stats
- ✅ Check payment history
- ✅ See unpaid students
- ✅ View all transactions

### As Admin:
- ✅ Add expenses with proof images
- ✅ Add income records
- ✅ Update student payment status
- ✅ View all transactions

## ⚠️ Important Notes

- Default password storage is plain text (demo only!)
- For production: Use bcrypt for password hashing
- Enable Row Level Security (RLS) in Supabase
- Configure CORS for your domain
- Use HTTPS in production

## 📱 Mobile Testing

- Use DevTools device emulation (F12 → Toggle device toolbar)
- Or test on actual mobile device: `npm run dev` then use IP address

## 🆘 Troubleshooting

**"Cannot find supabase credentials"**
- Check `.env.local` file exists
- Verify VITE_ prefix on variable names
- Restart dev server after creating .env

**"Students not loading in dropdown"**
- Check students table is created
- Verify sample data was inserted
- Check browser console for errors

**"Images not uploading"**
- Ensure storage bucket "expense-proofs" exists
- Check bucket is public or RLS configured
- Verify Supabase credentials

**Build fails**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node version: `node -v` (should be 18+)

## 📚 Additional Resources

- Vite Docs: https://vitejs.dev
- React Docs: https://react.dev
- Supabase Docs: https://supabase.com/docs
- TailwindCSS: https://tailwindcss.com
- Framer Motion: https://www.framer.com/motion

---

**Ready to go!** 🚀

Questions? Check README.md for more details.