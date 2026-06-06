@AGENTS.md

- JANGAN PERNAH membuat atau mengeksekusi file testing/skrip pengujian (seperti test-mongo.js, test-connection.js) secara mandiri untuk mendiagnosis masalah environment.
- Jika mendeteksi masalah drive mapping, izin PowerShell, atau error terminal, SEGERA laporkan ke user dan minta panduan, jangan mencoba memperbaikinya sendiri lewat eksperimen terminal.
- Hindari penggunaan perintah 'cmd /c' atau bypass shell secara agresif kecuali diinstruksikan secara eksplisit.
- Jika terjadi Mongoose connection error atau timeout saat aplikasi berjalan, jangan langsung membuat file test baru. SEGERA:**1. Tampilkan isi variabel environment MONGODB_URI yang terbaca oleh script.2. Tanyakan kepada user apakah IP address-nya sudah ditambahkan ke IP whitelist MongoDB Atlas.3. Minta user untuk memverifikasi status connection string mereka.4. Hanya buat file test setelah mendapat izin eksplisit dari user untuk debugging. 