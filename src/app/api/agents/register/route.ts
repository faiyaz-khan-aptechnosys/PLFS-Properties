
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const agentSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const result = agentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid registration details.",
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, password } = result.data;
    const email = result.data.email.toLowerCase();

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

    const agent = await User.create({
      name,
      email,
      passwordHash,
      role: "agent",
      status: "active",
      emailVerified: false,
      agentApprovalStatus: "pending",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Agent registration submitted. Awaiting admin approval.",
        agent: {
          id: agent._id.toString(),
          name: agent.name,
          email: agent.email,
          role: agent.role,
          agentApprovalStatus: agent.agentApprovalStatus,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
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

    console.error("Agent registration error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to register agent right now.",
      },
      { status: 500 }
    );
  }
}
