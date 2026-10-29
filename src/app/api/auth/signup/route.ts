
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const signupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please check your signup details.",
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const name = result.data.name;
    const email = result.data.email.toLowerCase();
    const password = result.data.password;

    await connectDB();

    const existingUser = await User.findOne({ email }).lean();

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: "user",
      status: "active",
      emailVerified: false,
      agentApprovalStatus: "not_applicable",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    // Handle duplicate email race conditions.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    console.error("Signup error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create account right now.",
      },
      { status: 500 }
    );
  }
}
