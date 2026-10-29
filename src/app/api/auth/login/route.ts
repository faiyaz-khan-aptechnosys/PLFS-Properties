
import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid email and password.",
        },
        { status: 400 }
      );
    }

    const email = result.data.email.toLowerCase();
    const password = result.data.password;
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET || JWT_SECRET.length < 32) {
      console.error("JWT_SECRET is missing or too short.");

      return NextResponse.json(
        {
          success: false,
          message: "Authentication is not configured correctly.",
        },
        { status: 500 }
      );
    }

    await connectDB();

    // passwordHash has select: false in the User model.
    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is suspended.",
        },
        { status: 403 }
      );
    }

    // Agents must be approved before they can log in.
    if (
      user.role === "agent" &&
      user.agentApprovalStatus !== "approved"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Your agent account is awaiting approval.",
        },
        { status: 403 }
      );
    }

    const secret = new TextEncoder().encode(JWT_SECRET);

    const token = await new SignJWT({
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user._id.toString())
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set({
      name: "plfs_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to log in right now.",
      },
      { status: 500 }
    );
  }
}
