export type AppRole = "owner" | "admin" | "member";
export type OrgPlan = "free" | "pro";
export type InviteRole = "admin" | "member";
export type InviteStatus = "pending" | "accepted" | "expired" | "revoked";
export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "failed";
export type CampaignRecipientStatus =
  | "draft"
  | "queued"
  | "sent"
  | "failed"
  | "opened"
  | "clicked";
export type ReviewSource = "internal" | "google";
export type ReviewStatus = "new" | "in_progress" | "resolved" | "archived";

type Timestamp = string;

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          slug: string;
          name: string;
          plan: OrgPlan;
          notifications_enabled: boolean;
          language: string;
          timezone: string;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          plan?: OrgPlan;
          notifications_enabled?: boolean;
          language?: string;
          timezone?: string;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          org_id: string | null;
          email: string;
          full_name: string | null;
          role: AppRole;
          avatar_url: string | null;
          last_seen_at: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id: string;
          org_id?: string | null;
          email: string;
          full_name?: string | null;
          role: AppRole;
          avatar_url?: string | null;
          last_seen_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      organization_invites: {
        Row: {
          id: string;
          org_id: string;
          email: string;
          role: InviteRole;
          token_hash: string;
          status: InviteStatus;
          invited_by: string | null;
          accepted_by: string | null;
          expires_at: Timestamp;
          accepted_at: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          org_id: string;
          email: string;
          role: InviteRole;
          token_hash: string;
          status?: InviteStatus;
          invited_by?: string | null;
          accepted_by?: string | null;
          expires_at: Timestamp;
          accepted_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["organization_invites"]["Insert"]>;
      };
      contacts: {
        Row: {
          id: string;
          org_id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          company: string | null;
          tags: string[];
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          org_id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          company?: string | null;
          tags?: string[];
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["contacts"]["Insert"]>;
      };
      reviews: {
        Row: {
          id: string;
          org_id: string;
          source: ReviewSource;
          external_id: string | null;
          author_name: string | null;
          rating: number;
          content: string | null;
          sentiment: string | null;
          status: ReviewStatus;
          published_at: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          org_id: string;
          source: ReviewSource;
          external_id?: string | null;
          author_name?: string | null;
          rating: number;
          content?: string | null;
          sentiment?: string | null;
          status?: ReviewStatus;
          published_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
      };
      review_analysis: {
        Row: {
          id: string;
          review_id: string;
          org_id: string;
          sentiment_label: string | null;
          sentiment_score: number | null;
          themes: string[];
          summary: string | null;
          generated_at: Timestamp;
        };
        Insert: {
          id?: string;
          review_id: string;
          org_id: string;
          sentiment_label?: string | null;
          sentiment_score?: number | null;
          themes?: string[];
          summary?: string | null;
          generated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["review_analysis"]["Insert"]>;
      };
      campaigns: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          subject: string;
          template: string;
          status: CampaignStatus;
          scheduled_at: Timestamp | null;
          created_by: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          subject: string;
          template: string;
          status?: CampaignStatus;
          scheduled_at?: Timestamp | null;
          created_by?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["campaigns"]["Insert"]>;
      };
      campaign_recipients: {
        Row: {
          id: string;
          campaign_id: string;
          org_id: string;
          contact_id: string | null;
          email: string;
          full_name: string | null;
          provider_message_id: string | null;
          status: CampaignRecipientStatus;
          sent_at: Timestamp | null;
          opened_at: Timestamp | null;
          clicked_at: Timestamp | null;
          created_at: Timestamp;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          org_id: string;
          contact_id?: string | null;
          email: string;
          full_name?: string | null;
          provider_message_id?: string | null;
          status?: CampaignRecipientStatus;
          sent_at?: Timestamp | null;
          opened_at?: Timestamp | null;
          clicked_at?: Timestamp | null;
          created_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["campaign_recipients"]["Insert"]>;
      };
      billing_customers: {
        Row: {
          id: string;
          org_id: string;
          provider: string;
          provider_customer_id: string | null;
          created_at: Timestamp;
        };
        Insert: {
          id?: string;
          org_id: string;
          provider?: string;
          provider_customer_id?: string | null;
          created_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["billing_customers"]["Insert"]>;
      };
      subscriptions: {
        Row: {
          id: string;
          org_id: string;
          provider: string;
          provider_subscription_id: string | null;
          plan: OrgPlan;
          status: string;
          renews_at: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          org_id: string;
          provider?: string;
          provider_subscription_id?: string | null;
          plan?: OrgPlan;
          status?: string;
          renews_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
      };
      invoices: {
        Row: {
          id: string;
          org_id: string;
          provider_invoice_id: string | null;
          amount_cents: number;
          currency: string;
          status: string;
          invoice_url: string | null;
          issued_at: Timestamp | null;
          created_at: Timestamp;
        };
        Insert: {
          id?: string;
          org_id: string;
          provider_invoice_id?: string | null;
          amount_cents: number;
          currency?: string;
          status: string;
          invoice_url?: string | null;
          issued_at?: Timestamp | null;
          created_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["invoices"]["Insert"]>;
      };
      audit_logs: {
        Row: {
          id: string;
          org_id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Record<string, unknown>;
          created_at: Timestamp;
        };
        Insert: {
          id?: string;
          org_id: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
      };
    };
    Views: {
      dashboard_summary: {
        Row: {
          org_id: string;
          org_name: string;
          contacts_count: number;
          reviews_count: number;
          campaigns_count: number;
          average_rating: number;
        };
      };
    };
  };
}

export type DbTableName = keyof Database["public"]["Tables"];
export type TableRow<T extends DbTableName> = Database["public"]["Tables"][T]["Row"];
export type TableInsert<T extends DbTableName> =
  Database["public"]["Tables"][T]["Insert"];
export type TableUpdate<T extends DbTableName> =
  Database["public"]["Tables"][T]["Update"];
