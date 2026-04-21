-- CreateEnum
CREATE TYPE "SideProjectStatus" AS ENUM ('IDEA', 'EVALUATING', 'VALIDATING', 'PRIORITIZED', 'IN_DEVELOPMENT', 'LAUNCHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SideProjectType" AS ENUM ('SAAS', 'MARKETPLACE', 'TOOL', 'AI', 'ECOMMERCE', 'APP', 'OTHER');

-- CreateEnum
CREATE TYPE "SideProjectRisk" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "SideProjectLinkType" AS ENUM ('DRIVE', 'NOTION', 'FIGMA', 'GITHUB', 'DOMAIN', 'HOSTING', 'OTHER');

-- CreateEnum
CREATE TYPE "SideTaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "SideTaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "side_projects" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "problem" TEXT,
    "solution" TEXT,
    "audience" TEXT,
    "type" "SideProjectType" NOT NULL DEFAULT 'OTHER',
    "monetization" TEXT,
    "status" "SideProjectStatus" NOT NULL DEFAULT 'IDEA',
    "score" INTEGER NOT NULL DEFAULT 0,
    "complexity" INTEGER NOT NULL DEFAULT 5,
    "revenuePotential" INTEGER NOT NULL DEFAULT 5,
    "timeEstimate" TEXT,
    "investment" TEXT,
    "risk" "SideProjectRisk" NOT NULL DEFAULT 'MEDIUM',
    "synergy" INTEGER NOT NULL DEFAULT 5,
    "stackSuggested" TEXT,
    "observations" TEXT,
    "brandName" TEXT,
    "slogan" TEXT,
    "brandColors" TEXT,
    "logoUrl" TEXT,
    "mrr" DOUBLE PRECISION,
    "cac" DOUBLE PRECISION,
    "roi" DOUBLE PRECISION,
    "totalRevenue" DOUBLE PRECISION,
    "totalCosts" DOUBLE PRECISION,
    "priorityOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "launchedAt" TIMESTAMP(3),
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "side_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "side_project_links" (
    "id" TEXT NOT NULL,
    "sideProjectId" TEXT NOT NULL,
    "type" "SideProjectLinkType" NOT NULL,
    "label" TEXT,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "side_project_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "side_project_tasks" (
    "id" TEXT NOT NULL,
    "sideProjectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "SideTaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "SideTaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "phase" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "side_project_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "side_project_notes" (
    "id" TEXT NOT NULL,
    "sideProjectId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "side_project_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "side_project_votes" (
    "id" TEXT NOT NULL,
    "sideProjectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "side_project_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "side_project_activity_logs" (
    "id" TEXT NOT NULL,
    "sideProjectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "side_project_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "side_projects_slug_key" ON "side_projects"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "side_project_votes_sideProjectId_userId_key" ON "side_project_votes"("sideProjectId", "userId");

-- AddForeignKey
ALTER TABLE "side_projects" ADD CONSTRAINT "side_projects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "side_project_links" ADD CONSTRAINT "side_project_links_sideProjectId_fkey" FOREIGN KEY ("sideProjectId") REFERENCES "side_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "side_project_tasks" ADD CONSTRAINT "side_project_tasks_sideProjectId_fkey" FOREIGN KEY ("sideProjectId") REFERENCES "side_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "side_project_notes" ADD CONSTRAINT "side_project_notes_sideProjectId_fkey" FOREIGN KEY ("sideProjectId") REFERENCES "side_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "side_project_notes" ADD CONSTRAINT "side_project_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "side_project_votes" ADD CONSTRAINT "side_project_votes_sideProjectId_fkey" FOREIGN KEY ("sideProjectId") REFERENCES "side_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "side_project_votes" ADD CONSTRAINT "side_project_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "side_project_activity_logs" ADD CONSTRAINT "side_project_activity_logs_sideProjectId_fkey" FOREIGN KEY ("sideProjectId") REFERENCES "side_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "side_project_activity_logs" ADD CONSTRAINT "side_project_activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
