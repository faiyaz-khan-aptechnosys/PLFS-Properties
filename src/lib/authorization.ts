
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import type { UserRole } from "@/models/User";

export async function authorizeRoles(
  request: NextRequest,
  allowedRoles: UserRole[]
) {
  const auth = await getAuthenticatedUser(request);

  if (!auth.success) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        {
          success: false,
          message: auth.message,
        },
        { status: auth.status }
      ),
    };
  }

  if (!allowedRoles.includes(auth.user.role)) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        {
          success: false,
          message: "You do not have permission to access this resource.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true as const,
    user: auth.user,
  };
}
