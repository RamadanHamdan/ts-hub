import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: {
      tamu: [], // isi dengan data dari database jika sudah ada
    },
  });
}