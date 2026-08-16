"use client";

import { useEffect } from "react";
import { trackProductEvent } from "@/lib/analytics-client";

export function ProductEvent({ event, seriesId, chapterId }: { event: string; seriesId?: number; chapterId?: number }) {
  useEffect(() => {
    trackProductEvent(event, { seriesId, chapterId });
  }, [event, seriesId, chapterId]);
  return null;
}
