"use client"

import { Store } from "../types/store.types"
import { useState } from "react"
import { StoreDetailModal } from "./store-detail-modal"

interface StoreTableProps {
  stores: Store[]
}

export function StoreTable({ stores }: StoreTableProps) {
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleRowClick = (store: Store) => {
    setSelectedStore(store)
    setIsModalOpen(true)
  }

  return (
    <>
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-12 px-4 text-left align-middle font-medium">店舗名</th>
              <th className="h-12 px-4 text-left align-middle font-medium">住所</th>
              <th className="h-12 px-4 text-left align-middle font-medium">電話番号</th>
              <th className="h-12 px-4 text-left align-middle font-medium">登録日</th>
            </tr>
          </thead>
          <tbody>
            {stores.length === 0 ? (
              <tr>
                <td colSpan={4} className="h-24 text-center text-muted-foreground">
                  店舗が見つかりませんでした
                </td>
              </tr>
            ) : (
              stores.map((store) => (
                <tr
                  key={store.id}
                  onClick={() => handleRowClick(store)}
                  className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                >
                  <td className="p-4 align-middle font-medium">{store.name}</td>
                  <td className="p-4 align-middle">{store.address}</td>
                  <td className="p-4 align-middle">{store.phone || "-"}</td>
                  <td className="p-4 align-middle">
                    {new Date(store.createdAt).toLocaleDateString("ja-JP")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <StoreDetailModal
        store={selectedStore}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedStore(null)
        }}
      />
    </>
  )
}
