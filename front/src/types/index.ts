export type ProjectCategory = string;

export type ProjectStatus = string;

export type CriterionKey =
  | 'social'
  | 'economic'
  | 'urgency'
  | 'justice'
  | 'strategy'
  | 'risk';

export interface Criterion {
  key: CriterionKey;
  label: string;
  hint: string;
  weight: number;
}

export interface Project {
  id: string;
  name: string;
  district: string;
  category: ProjectCategory;
  status: ProjectStatus;
  budget: number;
  score: number;
  justice: number;
  risk: number;
  deviation: number;
  progress: number;
  aiRecommended: boolean;
  scores: Record<CriterionKey, number>;
  lat: number;
  lng: number;
  explain: string;
}

export interface Neighborhood {
  id: string;
  name: string;
  deprivation: number;
  projects: number;
  population: number;
  lat: number;
  lng: number;
}

export interface Scenario {
  id: string;
  name: string;
  budget: number;
  projects: number;
  coverage: number;
  justice: number;
}

export interface AuditEntry {
  id: string;
  actor: string;
  role: string;
  action: string;
  date: string;
  time: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  kind: 'ai' | 'budget' | 'system';
  unread: boolean;
}

export interface DecisionHistoryEntry {
  id: string;
  date: string;
  title: string;
  detail: string;
}

export interface SystemData {
  notifications: Notification[];
  auditTrail: AuditEntry[];
  savedScenarios: Scenario[];
  decisionHistory: DecisionHistoryEntry[];
}

export interface DashboardData {
  projects: Project[];
  criteria: Criterion[];
  neighborhoods: Neighborhood[];
  system: SystemData;
}
