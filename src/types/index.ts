import type { Tables } from './database.types'

export type Profile = Tables<'profiles'>
export type Workspace = Tables<'workspaces'>
export type WorkspaceMember = Tables<'workspace_members'>
export type Lead = Tables<'leads'>
export type LandingForm = Tables<'landing_forms'>
export type WorkspaceIntegration = Tables<'workspace_integrations'>
export type Campaign = Tables<'campaigns'>
export type MessageLog = Tables<'message_logs'>
export type Scenario = Tables<'scenarios'>
export type ScenarioStep = Tables<'scenario_steps'>
export type ScenarioEnrollment = Tables<'scenario_enrollments'>
export type ScenarioLog = Tables<'scenario_logs'>
export type LeadSource = Tables<'lead_sources'>
export type LeadGroup = Tables<'lead_groups'>
export type LeadGroupMembership = Tables<'lead_group_memberships'>
export type WorkspaceCredit = Tables<'workspace_credits'>
export type CreditTransaction = Tables<'credit_transactions'>
export type WorkspaceKakaoChannel = Tables<'workspace_kakao_channels'>
export type MessagePricing = Tables<'message_pricing'>
