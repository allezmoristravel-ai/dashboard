"use client";

import { use } from "react";
import { useRequests } from "@/lib/store";
import { RequestDetail } from "@/components/request-detail";

export default function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getRequest, loading } = useRequests();
  const request = getRequest(id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-lg font-semibold">Request not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The request with ID &ldquo;{id}&rdquo; does not exist.
        </p>
      </div>
    );
  }

  return <RequestDetail request={request} />;
}
