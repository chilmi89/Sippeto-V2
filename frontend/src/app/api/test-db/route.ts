import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Attempt a simple query to verify connection
    const result = await prisma.$queryRaw`SELECT NOW()`;
    
    return NextResponse.json({
      status: "success",
      message: "Database connection established",
      data: result,
    });
  } catch (error: any) {
    console.error("Database Connection Error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to connect to database",
        error: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
