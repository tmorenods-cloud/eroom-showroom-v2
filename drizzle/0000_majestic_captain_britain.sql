CREATE TABLE "demos" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"categoria" text NOT NULL,
	"orden" integer NOT NULL,
	"titulo" text NOT NULL,
	"descripcion" text DEFAULT '' NOT NULL,
	"imagen" text NOT NULL,
	"pdf_url" text DEFAULT '' NOT NULL,
	"video_url" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "demos" ADD CONSTRAINT "demos_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;