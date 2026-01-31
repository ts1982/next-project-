import { NextRequest, NextResponse } from "next/server";
import {
  getStoreById,
  updateStore,
  deleteStore,
} from "@/features/stores/services/store.service";
import { updateStoreSchema } from "@/features/stores/schemas/store.schema";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const storeId = parseInt(id);

    if (isNaN(storeId)) {
      return NextResponse.json({ error: "無効なIDです" }, { status: 400 });
    }

    const store = await getStoreById(storeId);

    if (!store) {
      return NextResponse.json(
        { error: "店舗が見つかりません" },
        { status: 404 },
      );
    }

    return NextResponse.json(store);
  } catch (error) {
    console.error("Failed to fetch store:", error);
    return NextResponse.json(
      { error: "店舗の取得に失敗しました" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const storeId = parseInt(id);

    if (isNaN(storeId)) {
      return NextResponse.json({ error: "無効なIDです" }, { status: 400 });
    }

    const body = await request.json();

    // バリデーション
    const result = updateStoreSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "入力データが不正です", details: result.error.issues },
        { status: 400 },
      );
    }

    const store = await updateStore(storeId, result.data);

    return NextResponse.json(store);
  } catch (error) {
    console.error("Failed to update store:", error);
    return NextResponse.json(
      { error: "店舗の更新に失敗しました" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const storeId = parseInt(id);

    if (isNaN(storeId)) {
      return NextResponse.json({ error: "無効なIDです" }, { status: 400 });
    }

    await deleteStore(storeId);

    return NextResponse.json({ message: "店舗を削除しました" });
  } catch (error) {
    console.error("Failed to delete store:", error);
    return NextResponse.json(
      { error: "店舗の削除に失敗しました" },
      { status: 500 },
    );
  }
}
