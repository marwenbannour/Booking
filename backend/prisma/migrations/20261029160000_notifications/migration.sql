-- Booking reminder consent snapshot
ALTER TABLE "bookings"
ADD COLUMN "reminders_consent" BOOLEAN NOT NULL DEFAULT false;

-- Notification delivery log
CREATE TABLE "notification_logs" (
    "id" UUID NOT NULL,
    "establishment_id" UUID NOT NULL,
    "notification_job_id" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "provider" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL,
    "recipient" TEXT,
    "provider_message_id" TEXT,
    "error_code" TEXT,
    "error_message" TEXT,
    "detail" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notification_logs_establishment_id_created_at_idx"
ON "notification_logs"("establishment_id", "created_at");

CREATE INDEX "notification_logs_notification_job_id_created_at_idx"
ON "notification_logs"("notification_job_id", "created_at");

CREATE INDEX "notification_logs_provider_message_id_idx"
ON "notification_logs"("provider_message_id");

ALTER TABLE "notification_logs"
ADD CONSTRAINT "notification_logs_establishment_id_fkey"
FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notification_logs"
ADD CONSTRAINT "notification_logs_notification_job_id_fkey"
FOREIGN KEY ("notification_job_id") REFERENCES "notification_jobs"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Per-establishment notification settings
CREATE TABLE "notification_settings" (
    "establishment_id" UUID NOT NULL,
    "whatsapp_enabled" BOOLEAN NOT NULL DEFAULT true,
    "confirmation_enabled" BOOLEAN NOT NULL DEFAULT true,
    "cancellation_enabled" BOOLEAN NOT NULL DEFAULT true,
    "first_reminder_minutes_before" INTEGER DEFAULT 1440,
    "second_reminder_minutes_before" INTEGER DEFAULT 120,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("establishment_id")
);

ALTER TABLE "notification_settings"
ADD CONSTRAINT "notification_settings_establishment_id_fkey"
FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Lookup indexes for reminder cancellation and webhook delivery updates
CREATE INDEX "notification_jobs_booking_id_event_type_status_idx"
ON "notification_jobs"("booking_id", "event_type", "status");

CREATE INDEX "notification_jobs_provider_message_id_idx"
ON "notification_jobs"("provider_message_id");
