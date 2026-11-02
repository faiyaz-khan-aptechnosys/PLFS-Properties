
import { NextRequest, NextResponse, connection } from "next/server";
import { authorizeRoles } from "@/lib/authorization";

export async function GET(request: NextRequest) {
  await connection();
  try {
    const auth = await authorizeRoles(request, ["admin"]);

    if (!auth.authorized) {
      return auth.response;
    }

    return NextResponse.json({
      success: true,
      message: "Welcome to the admin dashboard.",
      admin: {
        id: auth.user._id.toString(),
        name: auth.user.name,
        email: auth.user.email,
        role: auth.user.role,
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error.",
      },
      { status: 500 }
    );
  }
}
