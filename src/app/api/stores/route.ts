import { NextRequest, NextResponse } from "next/server"
import { createStore, getStoreList } from "@/features/stores/services/store.service"
import { createStoreSchema } from "@/features/stores/schemas/store.schema"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const page = parseInt(searchParams.get("page") || "1")

    const data = await getStoreList(search, page)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Failed to fetch stores:", error)
    return NextResponse.json({ error: "店舗の取得に失敗しました" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // バリデーション
    const result = createStoreSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "入力データが不正です", details: result.error.issues },
        { status: 400 }
      )
    }

    const store = await createStore(result.data)

    return NextResponse.json(store, { status: 201 })
  } catch (error) {
    console.error("Failed to create store:", error)
    return NextResponse.json({ error: "店舗の作成に失敗しました" }, { status: 500 })
  }
}
