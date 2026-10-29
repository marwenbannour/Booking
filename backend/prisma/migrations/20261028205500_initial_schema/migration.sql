-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- Prevent overlapping active bookings for the same employee.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'DISABLED');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'MANAGER', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "EstablishmentStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DISABLED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'REJECTED');

-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('WEB', 'MOBILE', 'STAFF');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('WHATSAPP', 'EMAIL', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'DELIVERED', 'FAILED', 'UNKNOWN', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "phone_normalized" TEXT,
    "password_hash" TEXT NOT NULL,
    "preferred_locale" TEXT NOT NULL DEFAULT 'fr',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "refresh_token_hash" BYTEA NOT NULL,
    "family_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "rotated_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMPTZ(6),

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "establishments" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Tunis',
    "currency" CHAR(3) NOT NULL DEFAULT 'TND',
    "locale" TEXT NOT NULL DEFAULT 'fr',
    "minimum_booking_notice_minutes" INTEGER NOT NULL DEFAULT 60,
    "maximum_booking_days" INTEGER NOT NULL DEFAULT 60,
    "cancellation_notice_hours" INTEGER NOT NULL DEFAULT 24,
    "status" "EstablishmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "establishments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "establishment_members" (
    "id" UUID NOT NULL,
    "establishment_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "MemberRole" NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "establishment_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "establishment_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "display_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL,
    "establishment_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration_minutes" INTEGER NOT NULL,
    "price" DECIMAL(12,3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_services" (
    "employee_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,

    CONSTRAINT "employee_services_pkey" PRIMARY KEY ("employee_id","service_id")
);

-- CreateTable
CREATE TABLE "business_hours" (
    "id" UUID NOT NULL,
    "establishment_id" UUID NOT NULL,
    "employee_id" UUID,
    "day_of_week" INTEGER NOT NULL,
    "opens_at" TIME(0) NOT NULL,
    "closes_at" TIME(0) NOT NULL,

    CONSTRAINT "business_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_offs" (
    "id" UUID NOT NULL,
    "establishment_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "time_offs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "establishment_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone_normalized" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "establishment_id" UUID NOT NULL,
    "public_reference" TEXT NOT NULL,
    "customer_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "source" "BookingSource" NOT NULL,
    "customer_name_snapshot" TEXT NOT NULL,
    "customer_phone_snapshot" TEXT,
    "customer_email_snapshot" TEXT,
    "service_name_snapshot" TEXT NOT NULL,
    "duration_minutes_snapshot" INTEGER NOT NULL,
    "price_snapshot" DECIMAL(12,3),
    "currency" CHAR(3) NOT NULL DEFAULT 'TND',
    "cancellation_reason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_access_tokens" (
    "id" UUID NOT NULL,
    "establishment_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "token_hash" BYTEA NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY['booking:read', 'booking:cancel']::TEXT[],
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_events" (
    "id" UUID NOT NULL,
    "establishment_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "actor_user_id" UUID,
    "data" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_jobs" (
    "id" UUID NOT NULL,
    "establishment_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "event_type" TEXT NOT NULL,
    "scheduled_at" TIMESTAMPTZ(6) NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "available_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lease_until" TIMESTAMPTZ(6),
    "idempotency_key" TEXT NOT NULL,
    "provider_message_id" TEXT,
    "error_code" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notification_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL,
    "establishment_id" UUID NOT NULL,
    "notification_job_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ(6),
    "publish_attempts" INTEGER NOT NULL DEFAULT 0,
    "lease_until" TIMESTAMPTZ(6),
    "last_error_code" TEXT,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "establishment_id" UUID,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" UUID,
    "correlation_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_records" (
    "id" UUID NOT NULL,
    "scope" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "request_hash" TEXT NOT NULL,
    "response_status" INTEGER,
    "response_body" JSONB,
    "resource_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "idempotency_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_normalized_key" ON "users"("phone_normalized");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_refresh_token_hash_key" ON "auth_sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "auth_sessions_user_id_expires_at_idx" ON "auth_sessions"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "auth_sessions_family_id_idx" ON "auth_sessions"("family_id");

-- CreateIndex
CREATE UNIQUE INDEX "establishments_slug_key" ON "establishments"("slug");

-- CreateIndex
CREATE INDEX "establishment_members_user_id_status_idx" ON "establishment_members"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "establishment_members_establishment_id_user_id_key" ON "establishment_members"("establishment_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_member_id_key" ON "employees"("member_id");

-- CreateIndex
CREATE INDEX "employees_establishment_id_is_active_idx" ON "employees"("establishment_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "employees_establishment_id_id_key" ON "employees"("establishment_id", "id");

-- CreateIndex
CREATE INDEX "services_establishment_id_is_active_idx" ON "services"("establishment_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "services_establishment_id_id_key" ON "services"("establishment_id", "id");

-- CreateIndex
CREATE INDEX "business_hours_establishment_id_day_of_week_idx" ON "business_hours"("establishment_id", "day_of_week");

-- CreateIndex
CREATE INDEX "business_hours_employee_id_day_of_week_idx" ON "business_hours"("employee_id", "day_of_week");

-- CreateIndex
CREATE INDEX "time_offs_establishment_id_employee_id_starts_at_idx" ON "time_offs"("establishment_id", "employee_id", "starts_at");

-- CreateIndex
CREATE INDEX "customers_establishment_id_phone_normalized_idx" ON "customers"("establishment_id", "phone_normalized");

-- CreateIndex
CREATE INDEX "customers_establishment_id_name_idx" ON "customers"("establishment_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "customers_establishment_id_id_key" ON "customers"("establishment_id", "id");

-- CreateIndex
CREATE INDEX "bookings_establishment_id_starts_at_idx" ON "bookings"("establishment_id", "starts_at");

-- CreateIndex
CREATE INDEX "bookings_establishment_id_employee_id_starts_at_idx" ON "bookings"("establishment_id", "employee_id", "starts_at");

-- CreateIndex
CREATE INDEX "bookings_establishment_id_customer_id_starts_at_idx" ON "bookings"("establishment_id", "customer_id", "starts_at");

-- CreateIndex
CREATE INDEX "bookings_establishment_id_status_starts_at_idx" ON "bookings"("establishment_id", "status", "starts_at");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_establishment_id_id_key" ON "bookings"("establishment_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_establishment_id_public_reference_key" ON "bookings"("establishment_id", "public_reference");

-- CreateIndex
CREATE UNIQUE INDEX "booking_access_tokens_token_hash_key" ON "booking_access_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "booking_access_tokens_establishment_id_booking_id_idx" ON "booking_access_tokens"("establishment_id", "booking_id");

-- CreateIndex
CREATE INDEX "booking_events_establishment_id_booking_id_created_at_idx" ON "booking_events"("establishment_id", "booking_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_jobs_idempotency_key_key" ON "notification_jobs"("idempotency_key");

-- CreateIndex
CREATE INDEX "notification_jobs_available_at_scheduled_at_status_idx" ON "notification_jobs"("available_at", "scheduled_at", "status");

-- CreateIndex
CREATE INDEX "outbox_events_created_at_published_at_idx" ON "outbox_events"("created_at", "published_at");

-- CreateIndex
CREATE INDEX "audit_logs_establishment_id_created_at_idx" ON "audit_logs"("establishment_id", "created_at");

-- CreateIndex
CREATE INDEX "idempotency_records_expires_at_idx" ON "idempotency_records"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_records_scope_idempotency_key_key" ON "idempotency_records"("scope", "idempotency_key");

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "establishment_members" ADD CONSTRAINT "establishment_members_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "establishment_members" ADD CONSTRAINT "establishment_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "establishment_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_services" ADD CONSTRAINT "employee_services_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_services" ADD CONSTRAINT "employee_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_hours" ADD CONSTRAINT "business_hours_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_hours" ADD CONSTRAINT "business_hours_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_offs" ADD CONSTRAINT "time_offs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_offs" ADD CONSTRAINT "time_offs_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_events" ADD CONSTRAINT "booking_events_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_events" ADD CONSTRAINT "booking_events_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_events" ADD CONSTRAINT "booking_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_jobs" ADD CONSTRAINT "notification_jobs_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_jobs" ADD CONSTRAINT "notification_jobs_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_notification_job_id_fkey" FOREIGN KEY ("notification_job_id") REFERENCES "notification_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "establishments"
  ADD CONSTRAINT "establishments_booking_limits_check"
  CHECK (
    "minimum_booking_notice_minutes" >= 0
    AND "maximum_booking_days" > 0
    AND "cancellation_notice_hours" >= 0
  );

ALTER TABLE "services"
  ADD CONSTRAINT "services_duration_positive_check" CHECK ("duration_minutes" > 0),
  ADD CONSTRAINT "services_price_nonnegative_check" CHECK ("price" IS NULL OR "price" >= 0);

ALTER TABLE "business_hours"
  ADD CONSTRAINT "business_hours_day_of_week_check" CHECK ("day_of_week" BETWEEN 0 AND 6),
  ADD CONSTRAINT "business_hours_order_check" CHECK ("opens_at" < "closes_at");

ALTER TABLE "time_offs"
  ADD CONSTRAINT "time_offs_order_check" CHECK ("starts_at" < "ends_at");

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_order_check" CHECK ("starts_at" < "ends_at"),
  ADD CONSTRAINT "bookings_duration_positive_check" CHECK ("duration_minutes_snapshot" > 0),
  ADD CONSTRAINT "bookings_price_nonnegative_check"
    CHECK ("price_snapshot" IS NULL OR "price_snapshot" >= 0);

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_employee_active_no_overlap"
  EXCLUDE USING gist (
    "employee_id" WITH =,
    tstzrange("starts_at", "ends_at", '[)') WITH &&
  )
  WHERE ("status" IN ('PENDING', 'CONFIRMED'));
