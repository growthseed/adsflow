export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      strategy_flows: {
        Row: {
          id: string
          workspace_id: string
          project_id: string | null
          name: string
          description: string | null
          client_name: string
          phase: number
          meta: Json
          flow_data: Json
          kpis: Json
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          project_id?: string | null
          name: string
          description?: string | null
          client_name: string
          phase?: number
          meta?: Json
          flow_data?: Json
          kpis?: Json
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          project_id?: string | null
          name?: string
          description?: string | null
          client_name?: string
          phase?: number
          meta?: Json
          flow_data?: Json
          kpis?: Json
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
