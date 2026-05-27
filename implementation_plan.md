# Fix Sidebar, Login, & Add User Management

## Problem Summary

1. **Sidebar tidak ter-render** — Sidebar component ada tapi banyak code yang di-comment out (menu nav, sections, dll), dan `dashboard/page.tsx` kosong
2. **Login page tidak berfungsi** — `handleLogin` di-comment out, input tidak terhubung ke state, belum ada API `/api/login` atau `/api/auth/me`
3. **Belum ada User collection di MongoDB** — Tidak ada User model dan API auth
4. **Belum ada fitur "Add User"** — Perlu dibuat dan hanya bisa diakses superadmin

---

## Proposed Changes

### 1. User Model & Seeder

#### [NEW] [User.ts](file:///c:/Users/ramad/data_coding/ts-hub/src/models/User.ts)
- Mongoose model untuk collection `users`
- Fields: `userId`, `username`, `email`, `password` (hashed), `fullName`, `role` (enum: `super_admin`, `admin`, `user`), `phone`, `isActive`
- Password hashing menggunakan **crypto** (built-in Node.js, tanpa dependency tambahan)

#### [NEW] [seed-superadmin.mjs](file:///c:/Users/ramad/data_coding/ts-hub/seed-superadmin.mjs)
- Script untuk membuat superadmin pertama di MongoDB
- Default credentials: `superadmin` / `superadmin123`

---

### 2. Auth API Routes

#### [NEW] [route.ts](file:///c:/Users/ramad/data_coding/ts-hub/src/app/api/auth/login/route.ts)
- POST endpoint: terima `identity` (email/username) + `password`
- Cari user di collection `users`, verifikasi password
- Set cookie `session` berisi JSON `{ _id, userId, role, username, fullName }`
- Return user data + role

#### [NEW] [route.ts](file:///c:/Users/ramad/data_coding/ts-hub/src/app/api/auth/me/route.ts)
- GET endpoint: baca cookie `session`
- Return data user dari cookie (untuk SessionProvider)

#### [NEW] [route.ts](file:///c:/Users/ramad/data_coding/ts-hub/src/app/api/auth/logout/route.ts)
- POST endpoint: hapus cookie `session`

---

### 3. User Management API

#### [NEW] [route.ts](file:///c:/Users/ramad/data_coding/ts-hub/src/app/api/users/route.ts)
- **GET**: List semua users (hanya superadmin)
- **POST**: Create user baru (hanya superadmin), hash password, simpan ke collection `users`

---

### 4. Fix Login Page

#### [MODIFY] [page.tsx](file:///c:/Users/ramad/data_coding/ts-hub/src/app/page.tsx)
- Uncomment `handleLogin` function — hubungkan ke `/api/auth/login`
- Uncomment `value` dan `onChange` pada input fields
- Aktifkan state management (`identity`, `password`)
- Redirect ke `/dashboard` setelah login berhasil

---

### 5. Fix Sidebar & Menu System

#### [MODIFY] [menu.ts](file:///c:/Users/ramad/data_coding/ts-hub/src/lib/menu.ts)
- Tambah role `user` di Role type
- Tambah menu items untuk setiap role:
  - `super_admin`: Dashboard, Input Reservasi, **Manage Users**
  - `admin`: Dashboard, Input Reservasi
  - `user`: Dashboard

#### [MODIFY] [sidebar.tsx](file:///c:/Users/ramad/data_coding/ts-hub/src/components/sidebar/sidebar.tsx)
- Uncomment semua code menu/nav yang di-comment out
- Aktifkan kembali `getMenuByRole`, `sections`, `isActive`, `isSectionActive`
- Aktifkan scroll progress tracking
- Tampilkan role label user

#### [MODIFY] [SessionProvider.tsx](file:///c:/Users/ramad/data_coding/ts-hub/src/components/session/SessionProvider.tsx)
- Update role types agar match: `super_admin`, `admin`, `user`
- Panggil `refresh()` saat mount (useEffect)

---

### 6. Dashboard & User Management Pages

#### [MODIFY] [page.tsx](file:///c:/Users/ramad/data_coding/ts-hub/src/app/dashboard/page.tsx)
- Buat dashboard page sederhana dengan welcome message dan summary cards

#### [NEW] [page.tsx](file:///c:/Users/ramad/data_coding/ts-hub/src/app/users/page.tsx)
- Halaman manage users (hanya visible untuk superadmin via menu)
- Tabel list users
- Dialog/modal "Add User" dengan form: fullName, username, email, password, role, phone
- Tombol untuk create user baru

---

## Open Questions

> [!IMPORTANT]
> Apakah password hashing cukup menggunakan **crypto** (SHA-256 + salt) bawaan Node.js, atau harus install `bcrypt`? Saya akan gunakan crypto untuk menghindari dependency tambahan.

> [!NOTE]  
> Session saat ini menggunakan cookie sederhana (JSON di cookie). Untuk production sebaiknya gunakan JWT atau session store, tapi untuk tahap ini cukup dengan cookie approach.

---

## Verification Plan

### Automated Tests
- Run `npm run dev` dan tes flow:
  1. Jalankan `seed-superadmin.mjs` untuk buat user pertama
  2. Buka login page → login dengan superadmin
  3. Cek sidebar muncul dengan menu lengkap
  4. Buka halaman "Manage Users" → tambah user baru
  5. Logout → login dengan user baru
