CREATE TABLE "products" (
	"warehouse_id" text,
	"id" text,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"min_stock" integer DEFAULT 10 NOT NULL,
	CONSTRAINT "products_pkey" PRIMARY KEY("warehouse_id","id")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY,
	"warehouse_id" text NOT NULL,
	"product_id" text NOT NULL,
	"type" text NOT NULL,
	"quantity" integer NOT NULL,
	"note" text,
	"timestamp" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"username" text PRIMARY KEY,
	"password" text NOT NULL,
	"role" text NOT NULL,
	"fullname" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"location" text,
	"is_main" boolean DEFAULT false,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_warehouse_id_warehouses_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_warehouse_id_warehouses_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE;