import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createUserSchema } from "@/lib/types/user";
import { createUser } from "@/lib/services/user.service";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // 検索条件
    const where = search
      ? {
          OR: [{ name: { contains: search } }, { email: { contains: search } }],
        }
      : {};

    // 総数とデータを並行取得
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // zodでバリデーション
    const validatedData = createUserSchema.parse(body);

    // ユーザー作成
    const result = await createUser(validatedData);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to create user:", error);

    // zodバリデーションエラー
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      return NextResponse.json(
        { error: "バリデーションエラー", fields: fieldErrors },
        { status: 400 }
      );
    }

    // 重複エラー（メールアドレス）
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "このメールアドレスは既に使用されています" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "ユーザーの作成に失敗しました" },
      { status: 500 }
    );
  }
}
