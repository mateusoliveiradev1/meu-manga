"use client";

import { useState } from "react";
import { IconLink } from "@/components/ui/icons";

export function ShareButton({ title, text, className = "btn ghost" }: { title: string; text?: string; className?: string }) {
  const [message, setMessage] = useState("");
  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: window.location.href });
        setMessage("Compartilhado");
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setMessage("Link copiado");
      }
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") setMessage("Não foi possível compartilhar");
    }
    window.setTimeout(() => setMessage(""), 2200);
  }
  return <span className="share-control"><button type="button" className={className} onClick={share}><IconLink size={14} /> Compartilhar</button>{message && <span role="status">{message}</span>}</span>;
}
