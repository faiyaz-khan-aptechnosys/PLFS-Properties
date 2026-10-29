import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";

export async function GET() {
  try {
    await connectDB();
    await mongoose.connection.db?.admin().ping();

    return NextResponse.json({
      success: true,
      message: "PLFS Properties API is running",
      database: "Connected",
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
      },
      { status: 500 }
    );
  }
}