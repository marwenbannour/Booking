-- Enums
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED', 'EXPIRED');
CREATE TYPE "BillingInterval" AS ENUM ('MONTH', 'YEAR');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

-- Plans
CREATE TABLE "subscription_plans" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_amount" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "currency" CHAR(3) NOT NULL DEFAULT 'TND',
    "interval" "BillingInterval" NOT NULL DEFAULT 'MONTH',
    "trial_days" INTEGER NOT NULL DEFAULT 0,
    "max_employees" INTEGER,
    "max_bookings_per_month" INTEGER,
    "max_notifications_per_month" INTEGER,
    "max_establishments" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscription_plans_code_key" ON "subscription_plans"("code");

-- Subscriptions
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "establishment_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "current_period_start" TIMESTAMPTZ(6) NOT NULL,
    "current_period_end" TIMESTAMPTZ(6) NOT NULL,
    "trial_ends_at" TIMESTAMPTZ(6),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "canceled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscriptions_establishment_id_key" ON "subscriptions"("establishment_id");
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

ALTER TABLE "subscriptions"
ADD CONSTRAINT "subscriptions_establishment_id_fkey"
FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subscriptions"
ADD CONSTRAINT "subscriptions_plan_id_fkey"
FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Payments
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "establishment_id" UUID NOT NULL,
    "subscription_id" UUID,
    "provider" TEXT NOT NULL DEFAULT 'manual',
    "provider_reference" TEXT,
    "amount" DECIMAL(12,3) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'TND',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "period_start" TIMESTAMPTZ(6),
    "period_end" TIMESTAMPTZ(6),
    "paid_at" TIMESTAMPTZ(6),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payments_provider_provider_reference_key" ON "payments"("provider", "provider_reference");
CREATE INDEX "payments_establishment_id_created_at_idx" ON "payments"("establishment_id", "created_at");

ALTER TABLE "payments"
ADD CONSTRAINT "payments_establishment_id_fkey"
FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payments"
ADD CONSTRAINT "payments_subscription_id_fkey"
FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Reference plans (idempotent on code)
INSERT INTO "subscription_plans"
    ("id", "code", "name", "description", "price_amount", "currency", "interval", "trial_days",
     "max_employees", "max_bookings_per_month", "max_notifications_per_month", "max_establishments",
     "is_active", "is_public", "sort_order", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'free', 'Gratuit', 'Pour démarrer : un seul établissement et volume limité.',
     0, 'TND', 'MONTH', 0, 2, 100, 100, 1, true, true, 0, NOW(), NOW()),
    (gen_random_uuid(), 'pro', 'Pro', 'Pour les salons actifs : plus d''employés et de rappels.',
     49, 'TND', 'MONTH', 14, 10, 2000, 2000, 1, true, true, 1, NOW(), NOW()),
    (gen_random_uuid(), 'business', 'Business', 'Volume illimité et plusieurs établissements.',
     149, 'TND', 'MONTH', 14, NULL, NULL, NULL, 5, true, true, 2, NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
