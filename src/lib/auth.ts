
import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { connectDB } from "@/lib/db";
import User, { type IUser, type UserRole } from "@/models/User";

type AuthResult =
  | { success: true; user: IUser & { _id: import("mongoose").Types.ObjectId } }
  | { success: false; status: 401 | 403; message: string };

export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthResult> {
  const token = request.cookies.get("plfs_session")?.value;

  if (!token) {
    return {
      success: false,
      status: 401,
      message: "Authentication required.",
    };
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error("JWT_SECRET is missing or too short.");
  }

  let userId: string;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(jwtSecret),
      { algorithms: ["HS256"] }
    );

    if (typeof payload.sub !== "string") {
      return {
        success: false,
        status: 401,
        message: "Invalid session.",
      };
    }

    userId = payload.sub;
  } catch {
    return {
      success: false,
      status: 401,
      message: "Invalid or expired session.",
    };
  }

  await connectDB();

  const user = await User.findById(userId);

  if (!user) {
    return {
      success: false,
      status: 401,
      message: "Account not found.",
    };
  }

  if (user.status !== "active") {
    return {
      success: false,
      status: 403,
      message: "Account is suspended.",
    };
  }

  if (
    user.role === "agent" &&
    user.agentApprovalStatus !== "approved"
  ) {
    return {
      success: false,
      status: 403,
      message: "Agent approval is pending.",
    };
  }

  return { success: true, user };
}

export function hasRole(
  role: UserRole,
  allowedRoles: UserRole[]
): boolean {
  return allowedRoles.includes(role);
}
