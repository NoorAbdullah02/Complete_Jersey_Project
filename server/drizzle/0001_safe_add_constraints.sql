-- Safe manual migration: add defaults and constraints without truncation or dropping primary keys
-- Run this against your database (psql) or include it in your migration flow.

BEGIN;

-- Ensure created_at / updated_at defaults
ALTER TABLE public.orders ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.orders ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.admin_users ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.expenses ALTER COLUMN created_at SET DEFAULT now();

-- Add foreign key on order_items -> orders if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = 'order_items'
          AND kcu.column_name = 'order_id'
    ) THEN
        ALTER TABLE public.order_items
        ADD CONSTRAINT order_items_order_id_orders_id_fk
        FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
END$$;

-- Add unique constraint for admin_users.username if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE c.contype = 'u'
          AND t.relname = 'admin_users'
          AND EXISTS (
              SELECT 1 FROM unnest(c.conkey) WITH ORDINALITY AS cols(attnum, ord)
              JOIN pg_attribute a ON a.attnum = cols.attnum AND a.attrelid = t.oid
              WHERE a.attname = 'username'
          )
    ) THEN
        ALTER TABLE public.admin_users
        ADD CONSTRAINT admin_users_username_unique UNIQUE (username);
    END IF;
END$$;

COMMIT;
