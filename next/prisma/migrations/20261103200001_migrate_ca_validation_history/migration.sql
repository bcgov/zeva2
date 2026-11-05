BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "credit_application"
    WHERE ("last_validated_timestamp" IS NULL) <> ("validated_by_id" IS NULL)
  ) THEN
    RAISE EXCEPTION 'Credit applications have incomplete validation timestamps/users. Reconcile these records before migrating validation history.';
  END IF;
END $$;

INSERT INTO "credit_application_history"
  ("credit_application_id", "user_id", "timestamp", "user_action", "comment")
SELECT "id", "validated_by_id", "last_validated_timestamp", 'VALIDATED',
  'Migrated last recorded validation; earlier validation events were not retained.'
FROM "credit_application"
WHERE "last_validated_timestamp" IS NOT NULL;

UPDATE "credit_application"
SET "status" = 'VALIDATED', "supplier_status" = 'SUBMITTED'
WHERE "status" = 'SUBMITTED' AND "last_validated_timestamp" IS NOT NULL;

ALTER TABLE "credit_application"
  DROP CONSTRAINT "credit_application_validated_by_id_fkey",
  DROP COLUMN "last_validated_timestamp",
  DROP COLUMN "validated_by_id";

COMMIT;
