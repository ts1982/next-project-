"use client";

import { Store } from "../types/store.types";
import { useState } from "react";
import { formatDate } from "@/lib/utils/date-format";
import { DataTable, type Column } from "@/components/common/data-table";
import { StoreDetailModal } from "./store-detail-modal";
import { PublicationStatusBadge } from "./publication-status-badge";

interface StoreTableProps {
  stores: Store[];
  timezone: string;
}

export function StoreTable({ stores, timezone }: StoreTableProps) {
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRowClick = (store: Store) => {
    setSelectedStore(store);
    setIsModalOpen(true);
  };

  const columns: Column<Store>[] = [
    {
      key: "name",
      header: "店舗名",
      render: (store) => <span className="font-medium">{store.name}</span>,
    },
    {
      key: "address",
      header: "住所",
      render: (store) => store.address,
      hideBelow: "md",
    },
    {
      key: "phone",
      header: "電話番号",
      render: (store) => store.phone || "-",
      hideBelow: "lg",
    },
    {
      key: "publicationStatus",
      header: "公開状態",
      render: (store) => (
        <PublicationStatusBadge
          publishedAt={store.publishedAt}
          unpublishedAt={store.unpublishedAt}
          timezone={timezone}
        />
      ),
    },
    {
      key: "createdAt",
      header: "登録日",
      render: (store) => formatDate(store.createdAt, timezone),
      hideBelow: "lg",
    },
  ];

  return (
    <>
      <DataTable
        data={stores}
        columns={columns}
        getRowKey={(store) => store.id}
        onRowClick={handleRowClick}
        emptyMessage="店舗が見つかりませんでした"
        ariaLabel="店舗一覧テーブル"
      />

      <StoreDetailModal
        store={selectedStore}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStore(null);
        }}
        timezone={timezone}
      />
    </>
  );
}
