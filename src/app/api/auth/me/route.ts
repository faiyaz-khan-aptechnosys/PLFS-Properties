
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("plfs_session")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required. Please log in.",
        },
        { status: 401 }
      );
    }

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

    const secret = new TextEncoder().encode(JWT_SECRET);

    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    if (typeof payload.sub !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid session." },
        { status: 401 }
      );
    }

    await connectDB();

    // Read the current account from MongoDB, not from the token alone.
    const user = await User.findById(payload.sub);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Account not found." },
        { status: 401 }
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { success: false, message: "Account is suspended." },
        { status: 403 }
      );
    }

    if (
      user.role === "agent" &&
      user.agentApprovalStatus !== "approved"
    ) {
      return NextResponse.json(
        { success: false, message: "Agent approval is pending." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid or expired session. Please log in again.",
      },
      { status: 401 }
    );
  }
}
