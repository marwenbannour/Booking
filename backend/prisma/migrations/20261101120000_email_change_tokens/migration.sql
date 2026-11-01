CREATE TABLE "email_change_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "token_hash" BYTEA NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_change_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_change_tokens_token_hash_key"
ON "email_change_tokens"("token_hash");

CREATE INDEX "email_change_tokens_user_id_idx"
ON "email_change_tokens"("user_id");

CREATE INDEX "email_change_tokens_expires_at_idx"
ON "email_change_tokens"("expires_at");

ALTER TABLE "email_change_tokens"
ADD CONSTRAINT "email_change_tokens_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
