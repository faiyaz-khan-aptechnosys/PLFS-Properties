
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { authorizeRoles } from "@/lib/authorization";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const approvalSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await authorizeRoles(request, ["admin"]);

    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid agent ID." },
        { status: 400 }
      );
    }

    const body: unknown = await request.json();
    const result = approvalSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Decision must be approved or rejected.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const agent = await User.findOneAndUpdate(
      {
        _id: id,
        role: "agent",
      },
      {
        $set: {
          agentApprovalStatus: result.data.decision,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("name email role status agentApprovalStatus");

    if (!agent) {
      return NextResponse.json(
        { success: false, message: "Agent not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        result.data.decision === "approved"
          ? "Agent approved successfully."
          : "Agent rejected successfully.",
      agent: {
        id: agent._id.toString(),
        name: agent.name,
        email: agent.email,
        role: agent.role,
        status: agent.status,
        agentApprovalStatus: agent.agentApprovalStatus,
      },
    });
  } catch (error) {
    console.error("Agent approval error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update agent approval." },
      { status: 500 }
    );
  }
}
