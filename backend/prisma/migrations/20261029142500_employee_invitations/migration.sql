CREATE TABLE "employee_invitations" (
    "id" UUID NOT NULL,
    "establishment_id" UUID NOT NULL,
    "invited_by_user_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "service_ids" UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
    "token_hash" BYTEA NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "accepted_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "employee_invitations_token_hash_key"
ON "employee_invitations"("token_hash");

CREATE INDEX "employee_invitations_establishment_id_email_idx"
ON "employee_invitations"("establishment_id", "email");

CREATE INDEX "employee_invitations_expires_at_idx"
ON "employee_invitations"("expires_at");

CREATE UNIQUE INDEX "employee_invitations_pending_email_key"
ON "employee_invitations"("establishment_id", "email")
WHERE "accepted_at" IS NULL AND "revoked_at" IS NULL;

ALTER TABLE "employee_invitations"
ADD CONSTRAINT "employee_invitations_establishment_id_fkey"
FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "employee_invitations"
ADD CONSTRAINT "employee_invitations_invited_by_user_id_fkey"
FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
