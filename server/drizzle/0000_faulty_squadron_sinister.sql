CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(30) NOT NULL,
	"name" varchar(60),
	"email" varchar(100),
	"password_hash" varchar(200) NOT NULL,
	"is_verified" boolean DEFAULT false,
	"verification_token" varchar(200),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "admin_users_username_unique" UNIQUE("username")
);
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"description" varchar(200) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"category" varchar(50) DEFAULT 'general',
	"date" varchar(20),
	"created_by" varchar(30),
	"created_at" timestamp DEFAULT now()
);
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"jersey_number" varchar(6) NOT NULL,
	"batch" varchar(15),
	"size" varchar(10) NOT NULL,
	"collar_type" varchar(20) NOT NULL,
	"sleeve_type" varchar(20) NOT NULL,
	"item_price" numeric(10, 2) NOT NULL
);
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(30) NOT NULL,
	"mobile_number" varchar(15) NOT NULL,
	"email" varchar(40) NOT NULL,
	"transaction_id" varchar(30),
	"notes" text,
	"final_price" numeric(10, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;