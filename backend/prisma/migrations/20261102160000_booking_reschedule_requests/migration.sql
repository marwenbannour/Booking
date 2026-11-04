ALTER TABLE "booking_access_tokens"
ALTER COLUMN "scopes"
SET DEFAULT ARRAY['booking:read', 'booking:cancel', 'booking:reschedule'];

ALTER TABLE "booking_access_tokens"
ADD CONSTRAINT "booking_access_tokens_booking_id_fkey"
FOREIGN KEY ("booking_id") REFERENCES "bookings"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "booking_reschedule_requests" (
    "id" UUID NOT NULL,
    "establishment_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "original_starts_at" TIMESTAMPTZ(6) NOT NULL,
    "original_employee_id" UUID NOT NULL,
    "requested_starts_at" TIMESTAMPTZ(6) NOT NULL,
    "requested_employee_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "decision_reason" TEXT,
    "decided_by_user_id" UUID,
    "decided_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "booking_reschedule_requests_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "booking_reschedule_requests_status_check"
      CHECK ("status" IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED')),
    CONSTRAINT "booking_reschedule_requests_establishment_id_fkey"
      FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "booking_reschedule_requests_booking_id_fkey"
      FOREIGN KEY ("booking_id") REFERENCES "bookings"("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "booking_reschedule_requests_requested_employee_id_fkey"
      FOREIGN KEY ("requested_employee_id") REFERENCES "employees"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "booking_reschedule_requests_establishment_id_status_created_at_idx"
ON "booking_reschedule_requests"("establishment_id", "status", "created_at");

CREATE INDEX "booking_reschedule_requests_booking_id_created_at_idx"
ON "booking_reschedule_requests"("booking_id", "created_at");

CREATE UNIQUE INDEX "booking_reschedule_requests_one_pending_per_booking_key"
ON "booking_reschedule_requests"("booking_id")
WHERE "status" = 'PENDING';
