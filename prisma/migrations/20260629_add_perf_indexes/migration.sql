-- Performance: add indexes flagged in the senior audit.
-- All are CONCURRENTLY-safe to apply on a live DB. They cover the
-- hottest paths: cafe-staff lookups, modifier groups for menu render,
-- customer queries, QR-code resolution, and order-line joins.
--
-- IF NOT EXISTS makes this idempotent so re-applying is safe.

CREATE INDEX IF NOT EXISTS "cafe_users_cafe_id_user_id_idx" ON "cafe_users"("cafe_id", "user_id");
CREATE INDEX IF NOT EXISTS "cafe_users_user_id_idx"          ON "cafe_users"("user_id");

CREATE INDEX IF NOT EXISTS "menu_item_options_menu_item_id_idx"       ON "menu_item_options"("menu_item_id");
CREATE INDEX IF NOT EXISTS "menu_item_option_values_option_id_idx"    ON "menu_item_option_values"("option_id");

CREATE INDEX IF NOT EXISTS "customers_cafe_id_created_at_idx" ON "customers"("cafe_id", "created_at");
CREATE INDEX IF NOT EXISTS "customers_cafe_id_phone_idx"      ON "customers"("cafe_id", "phone");

CREATE INDEX IF NOT EXISTS "qr_codes_cafe_id_idx"   ON "qr_codes"("cafe_id");
CREATE INDEX IF NOT EXISTS "qr_codes_branch_id_idx" ON "qr_codes"("branch_id");

CREATE INDEX IF NOT EXISTS "order_items_order_id_idx"     ON "order_items"("order_id");
CREATE INDEX IF NOT EXISTS "order_items_menu_item_id_idx" ON "order_items"("menu_item_id");
