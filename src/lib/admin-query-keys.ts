export type AdminOperationScope = "local" | "global";

export const adminQueryKeys = {
  reports: {
    all: ["admin", "reports"] as const,
    operation: (scope: AdminOperationScope, veredaId?: string | null) =>
      ["admin", "reports", "operation", scope, veredaId ?? "all"] as const,
    total: (veredaId?: string | null) =>
      ["admin", "reports", "dashboard", "total", veredaId ?? "all"] as const,
    pending: (veredaId?: string | null) =>
      ["admin", "reports", "dashboard", "pending", veredaId ?? "all"] as const,
    recent: (veredaId?: string | null) =>
      ["admin", "reports", "dashboard", "recent", veredaId ?? "all"] as const,
    categories: (veredaId?: string | null) =>
      ["admin", "reports", "dashboard", "categories", veredaId ?? "all"] as const,
    listingCount: (filters: {
      status: "all" | "pending" | "reviewed";
      category: string;
      veredaId: string;
      search: string;
    }) => ["admin", "reports", "listing-count", filters] as const,
    listing: (filters: {
      page: number;
      pageSize: number;
      order: "newest" | "oldest";
      status: "all" | "pending" | "reviewed";
      category: string;
      veredaId: string;
      search: string;
    }) => ["admin", "reports", "listing", filters] as const,
  },
  publications: {
    all: ["admin", "publications"] as const,
    operation: (scope: AdminOperationScope, veredaId?: string | null) =>
      ["admin", "publications", "operation", scope, veredaId ?? "all"] as const,
    activeCount: (veredaId?: string | null) =>
      ["admin", "publications", "dashboard", "active-count", veredaId ?? "all"] as const,
  },
  veredas: {
    options: ["admin", "veredas", "options"] as const,
    activeCount: ["admin", "veredas", "active-count"] as const,
    operation: (scope: AdminOperationScope) => ["admin", "veredas", "operation", scope] as const,
  },
  activity: {
    all: ["admin", "activity"] as const,
    recent: ["admin", "activity", "recent"] as const,
  },
  capacity: {
    usage: ["admin", "capacity", "usage"] as const,
  },
} as const;
