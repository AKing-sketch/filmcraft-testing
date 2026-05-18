import { createContext, useContext } from "react";
import { useParams } from "wouter";

interface PodProjectContextValue {
  projectId: number;
  podSlug: string;
}

export const PodProjectContext = createContext<PodProjectContextValue | null>(null);

export function useProjectId(): number {
  const ctx = useContext(PodProjectContext);
  const params = useParams<{ id?: string }>();
  if (ctx) return ctx.projectId;
  return parseInt(params.id || "0", 10);
}

export function usePodContext(): PodProjectContextValue | null {
  return useContext(PodProjectContext);
}
