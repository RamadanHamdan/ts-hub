"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { redirect } from "next/navigation";
import { useSession } from "@/src/components/session/SessionProvider";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useSession();

  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Langsung redirect jika sudah login
    refresh();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login gagal");
        return;
      }

      // Refresh session untuk memuat data user baru
      await refresh();

      // Redirect ke halaman sesuai role
      const role = data.user?.role || "tamu";

      if (role === "super_admin" || role === "admin") {
        router.push("/reservasi/input");
      } else {
        router.push("/dashboard"); // Default untuk tamu
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200 px-4">
      {/* Container relatif untuk efek overlap */}
      <div className="relative flex items-center" style={{ width: "700px", height: "420px" }}>

        {/* Panel Biru - melayang, lebih tinggi dari form */}
        <div
          className="absolute right-0 rounded-2xl text-white flex flex-col items-center justify-center text-center overflow-hidden"
          style={{
            width: "55%",
            height: "460px",
            top: "-20px",
            backgroundImage: "url(/logo.png)",   // ← ganti nama sesuai file logo kamu
            backgroundSize: "65%",
            backgroundPosition: "center 30%",
            backgroundRepeat: "no-repeat",
            boxShadow: "0 20px 60px rgba(10, 45, 110, 0.5)",
            zIndex: 1,
            backgroundColor: "#0F172A",
          }}
        >
          {/* Overlay gelap di bagian bawah agar teks terbaca */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            height: "35%",
            background: "linear-gradient(to top, rgba(7,31,69,0.95) 60%, transparent)",
          }} />
          <p className="text-blue-200 text-xs mb-10 px-2 leading-relaxed" style={{ marginTop: "300px" }}>
            Masukkan data Anda
          </p>
          <Link
            href="/signup"
            className="z-10 border border-white text-white text-xs px-8 py-2 rounded-full hover:bg-white hover:text-blue-800 transition-colors font-semibold tracking-widest"
          >
            DAFTAR
          </Link>
        </div>

        {/* Form Putih - overlap ke panel biru */}
        <div
          className="absolute left-0 bg-white rounded-2xl flex flex-col justify-center"
          style={{
            width: "50%",
            height: "380px",
            padding: "36px 32px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
            zIndex: 2,
          }}
        >
          <h2 className="text-base font-bold text-gray-700 text-center mb-5">Login please</h2>

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            {/* Input Email */}
            <div className="mb-3 flex items-center border border-gray-200 rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400">
              <svg className="w-4 h-4 text-gray-400 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
              <input
                type="text"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                className="w-full text-sm outline-none text-gray-700 placeholder-gray-300"
                placeholder="Input your ID or Email"
                required
              />
            </div>

            {/* Input Password */}
            <div className="mb-4 flex items-center border border-gray-200 rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400">
              <svg className="w-4 h-4 text-gray-400 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm outline-none text-gray-700 placeholder-gray-300"
                placeholder="Input your password"
                required
              />
            </div>

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between mb-5">
              <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                <input type="checkbox" className="accent-blue-600" />
                Remember me
              </label>
              <a href="#" className="text-xs text-gray-400 hover:text-blue-600 transition-colors">
                Forgot Password?
              </a>
            </div>

            {error && (
              <div className="mb-3 p-2 bg-red-50 text-red-500 text-xs rounded-md border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-md text-white text-sm font-semibold tracking-wide transition-colors flex items-center justify-center gap-2 ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              {loading ? "LOGIN..." : "LOG IN"}
            </button>
          </form>
        </div>

      </div>
    </div >
  );
}