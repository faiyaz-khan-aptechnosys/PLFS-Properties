
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "../src/lib/db";
import User from "../src/models/User";

async function createAdmin() {
  try {
    const name = process.env.ADMIN_NAME?.trim();
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!name || !email || !password) {
      throw new Error(
        "ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD are required."
      );
    }

    if (password.length < 8) {
      throw new Error("Admin password must be at least 8 characters.");
    }

    await connectDB();

    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log("An admin account already exists.");
      return;
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new Error(
        "This email is already registered. Use another email."
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await User.create({
      name,
      email,
      passwordHash,
      role: "admin",
      status: "active",
      emailVerified: true,
      agentApprovalStatus: "not_applicable",
    });

    console.log("Admin account created successfully!");
    console.log("Admin ID:", admin._id.toString());
    console.log("Admin Email:", admin.email);
  } catch (error) {
    console.error("Admin creation failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
