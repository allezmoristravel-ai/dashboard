"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

const TableView = dynamic(
  () => import("@/components/table/table-view").then((m) => m.TableView),
  { ssr: false }
);

function TableLoading() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export default function TablePage() {
  return (
    <Suspense fallback={<TableLoading />}>
      <TableView />
    </Suspense>
  );
}
