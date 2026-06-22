CREATE TYPE "public"."audit_action" AS ENUM('CREATE', 'UPDATE', 'DELETE');--> statement-breakpoint
CREATE TYPE "public"."audit_entity_type" AS ENUM('SERVICE', 'DEPENDENCY', 'SIMULATION');--> statement-breakpoint
CREATE TYPE "public"."criticality" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."impact_type" AS ENUM('DIRECT', 'INDIRECT', 'ROOT');--> statement-breakpoint
CREATE TYPE "public"."service_status" AS ENUM('HEALTHY', 'DEGRADED', 'FAILED');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" "audit_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" "audit_action" NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dependencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_service_id" uuid NOT NULL,
	"target_service_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"owner" varchar(100) NOT NULL,
	"team" varchar(100) NOT NULL,
	"criticality" "criticality" DEFAULT 'MEDIUM' NOT NULL,
	"status" "service_status" DEFAULT 'HEALTHY' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulation_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"simulation_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"impact_type" "impact_type" NOT NULL,
	"impact_depth" integer DEFAULT 0 NOT NULL,
	"dependency_path" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"failed_services" jsonb NOT NULL,
	"total_impacted" integer DEFAULT 0 NOT NULL,
	"severity_score" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dependencies" ADD CONSTRAINT "dependencies_source_service_id_services_id_fk" FOREIGN KEY ("source_service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dependencies" ADD CONSTRAINT "dependencies_target_service_id_services_id_fk" FOREIGN KEY ("target_service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulation_results" ADD CONSTRAINT "simulation_results_simulation_id_simulations_id_fk" FOREIGN KEY ("simulation_id") REFERENCES "public"."simulations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulation_results" ADD CONSTRAINT "simulation_results_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "dependencies_unique" ON "dependencies" USING btree ("source_service_id","target_service_id");--> statement-breakpoint
CREATE INDEX "dependencies_source_idx" ON "dependencies" USING btree ("source_service_id");--> statement-breakpoint
CREATE INDEX "dependencies_target_idx" ON "dependencies" USING btree ("target_service_id");--> statement-breakpoint
CREATE UNIQUE INDEX "services_name_unique" ON "services" USING btree ("name");--> statement-breakpoint
CREATE INDEX "services_team_idx" ON "services" USING btree ("team");--> statement-breakpoint
CREATE INDEX "services_owner_idx" ON "services" USING btree ("owner");--> statement-breakpoint
CREATE INDEX "services_criticality_idx" ON "services" USING btree ("criticality");--> statement-breakpoint
CREATE INDEX "services_status_idx" ON "services" USING btree ("status");--> statement-breakpoint
CREATE INDEX "simulation_results_simulation_idx" ON "simulation_results" USING btree ("simulation_id");--> statement-breakpoint
CREATE INDEX "simulation_results_service_idx" ON "simulation_results" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "simulations_created_at_idx" ON "simulations" USING btree ("created_at");