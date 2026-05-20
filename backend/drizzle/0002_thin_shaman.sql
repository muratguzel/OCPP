ALTER TABLE "users" DROP CONSTRAINT "users_tenant_id_tenants_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "license_plate" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;