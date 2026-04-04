export type { UserRole, ProjectStatus, TaskStatus, CRMStage, InvoiceStatus } from "@prisma/client";

export interface DashboardKPIs {
  monthlyRevenue: number;
  activeProjects: number;
  pendingTasks: number;
  hoursThisMonth: number;
  overdueInvoices: number;
  newClients: number;
  revenueGrowth: number;
  completionRate: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  userId: string;
  userName: string;
  userImage?: string;
  createdAt: Date;
  link?: string;
}

export interface ProjectWithDetails {
  id: string;
  name: string;
  slug: string;
  status: string;
  priority: string;
  startDate?: Date | null;
  endDate?: Date | null;
  budget?: number | null;
  budgetCurrency: string;
  client?: { id: string; name: string; company?: string | null } | null;
  creator: { id: string; name: string; image?: string | null };
  members: Array<{
    employee: {
      user: { id: string; name: string; image?: string | null };
    };
  }>;
  _count: { tasks: number };
}

export interface TaskWithDetails {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: Date | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  project: { id: string; name: string; slug: string };
  assignments: Array<{
    user: { id: string; name: string; image?: string | null };
  }>;
  labels: Array<{ label: { id: string; name: string; color: string } }>;
  _count: { comments: number; attachments: number; subtasks: number };
}

export interface ClientWithDetails {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  stage: string;
  score: string;
  tags: string[];
  avatarUrl?: string | null;
  _count: { projects: number; interactions: number };
}

export interface InvoiceWithDetails {
  id: string;
  number: string;
  status: string;
  currency: string;
  total: number;
  issueDate: Date;
  dueDate: Date;
  client: { id: string; name: string; company?: string | null };
  project?: { id: string; name: string } | null;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pendingInvoices: number;
  overdueInvoices: number;
  currency: string;
}

export type SidebarItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  requiredRole?: string[];
  children?: SidebarItem[];
};
