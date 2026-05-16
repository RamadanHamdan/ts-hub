import { defineConfig } from "drizzle-kit"
import * as dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
    strict: true,
    verbose: true,
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        host: "127.0.0.1",
        port: 5432,
        user: "postgres",          // Ganti 'user' menjadi 'postgres'
        password: "ramadan",  // Masukkan password asli Postgres kamu di sini
        database: "ts-hub",
        ssl: false,
    },
    schema: "./src/db/schema.ts"
})