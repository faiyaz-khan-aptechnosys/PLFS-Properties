
import { NextRequest, NextResponse, connection } from "next/server";
import { authorizeRoles } from "@/lib/authorization";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const allowedStatuses = ["pending", "approved", "rejected", "all"];

export async function GET(request: NextRequest) {
  await connection();

  try {
    const auth = await authorizeRoles(request, ["admin"]);

    if (!auth.authorized) {
      return auth.response;
    }

    const status =
      request.nextUrl.searchParams.get("status") || "pending";

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid agent status filter." },
        { status: 400 }
      );
    }

    await connectDB();

    const filter: Record<string, unknown> = {
      role: "agent",
    };

    if (status !== "all") {
      filter.agentApprovalStatus = status;
    }

    const agents = await User.find(filter)
      .select("name email status agentApprovalStatus emailVerified createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: agents.length,
      agents: agents.map((agent) => ({
        id: agent._id.toString(),
        name: agent.name,
        email: agent.email,
        status: agent.status,
        agentApprovalStatus: agent.agentApprovalStatus,
        emailVerified: agent.emailVerified,
        createdAt: agent.createdAt,
      })),
    });
  } catch (error) {
    console.error("Fetch agents error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to fetch agents." },
      { status: 500 }
    );
  }
}
