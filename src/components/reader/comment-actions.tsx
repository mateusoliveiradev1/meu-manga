"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteCommentAction } from "@/features/comments/actions";
import { IconTrash } from "@/components/ui/icons";

export function DeleteComment({ commentId }: { commentId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function del() {
    if (!window.confirm("Apagar este comentário?")) return;
    setBusy(true);
    const res = await deleteCommentAction(commentId);
    if (res.ok) router.refresh();
    setBusy(false);
  }

  return (
    <button type="button" className="btn small ghost" onClick={del} disabled={busy} aria-label="Apagar comentário" style={{ marginLeft: "auto" }}>
      <IconTrash size={13} />
    </button>
  );
}
