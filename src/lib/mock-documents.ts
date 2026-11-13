// Types for the Documents & NDAs page. The documents themselves come from GET /api/documents.

export const documentTypes = ["NDA", "Safety Briefing", "Wi-Fi Policy", "Other"] as const;
export type DocumentType = (typeof documentTypes)[number];

export type VisitorDocument = {
  id: string;
  title: string;
  type: DocumentType;
  /** The text visitors read before signing */
  content: string;
  /** Visitors must sign it during check-in */
  requireSignature: boolean;
  /** Only active documents are shown to visitors at check-in */
  active: boolean;
  /** "Nov 11, 2026", as shown on screen */
  createdOn: string;
};

/** What the Create Document form hands back */
export type NewDocument = Omit<VisitorDocument, "id" | "active" | "createdOn">;
