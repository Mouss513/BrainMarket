export type UserStatus = 'active' | 'blocked'
export type CampaignStatus = 'active' | 'paused' | 'ended' | 'draft'
export type ConnectionStatus = 'active' | 'expired' | 'revoked' | 'error'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          clerk_id: string
          email: string
          created_at: string
          status: UserStatus
        }
        Insert: {
          id?: string
          clerk_id: string
          email: string
          created_at?: string
          status?: UserStatus
        }
        Update: {
          id?: string
          clerk_id?: string
          email?: string
          created_at?: string
          status?: UserStatus
        }
      }
      campaigns: {
        Row: {
          id: string
          user_id: string
          name: string
          platform: string
          budget: number
          roas: number | null
          ctr: number | null
          cpm: number | null
          status: CampaignStatus
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          platform: string
          budget: number
          roas?: number | null
          ctr?: number | null
          cpm?: number | null
          status?: CampaignStatus
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          platform?: string
          budget?: number
          roas?: number | null
          ctr?: number | null
          cpm?: number | null
          status?: CampaignStatus
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          user_id: string
          name: string
          category: string
          revenue: number
          units_sold: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          category: string
          revenue?: number
          units_sold?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          category?: string
          revenue?: number
          units_sold?: number
          created_at?: string
        }
      }
      brain_recommendations: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          confidence_score: number
          sector: string
          applied: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          confidence_score: number
          sector: string
          applied?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          confidence_score?: number
          sector?: string
          applied?: boolean
          created_at?: string
        }
      }
      market_insights: {
        Row: {
          id: string
          sector: string
          insight: string
          source: string
          confidence_score: number
          created_at: string
        }
        Insert: {
          id?: string
          sector: string
          insight: string
          source: string
          confidence_score: number
          created_at?: string
        }
        Update: {
          id?: string
          sector?: string
          insight?: string
          source?: string
          confidence_score?: number
          created_at?: string
        }
      }
      connections: {
        Row: {
          id: string
          user_id: string
          platform: string
          shop_domain: string | null
          access_token_encrypted: string
          scopes: string
          status: ConnectionStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          platform: string
          shop_domain?: string | null
          access_token_encrypted: string
          scopes?: string
          status?: ConnectionStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          platform?: string
          shop_domain?: string | null
          access_token_encrypted?: string
          scopes?: string
          status?: ConnectionStatus
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_status: UserStatus
      campaign_status: CampaignStatus
      connection_status: ConnectionStatus
    }
  }
}

// Convenience row types
export type User = Database['public']['Tables']['users']['Row']
export type Campaign = Database['public']['Tables']['campaigns']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type BrainRecommendation = Database['public']['Tables']['brain_recommendations']['Row']
export type MarketInsight = Database['public']['Tables']['market_insights']['Row']
export type Connection = Database['public']['Tables']['connections']['Row']
