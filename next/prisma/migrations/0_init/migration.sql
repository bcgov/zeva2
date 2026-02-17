-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ModelYear" AS ENUM ('MY_2017', 'MY_2018', 'MY_2019', 'MY_2020', 'MY_2021', 'MY_2022', 'MY_2023', 'MY_2024', 'MY_2025', 'MY_2026', 'MY_2027', 'MY_2028', 'MY_2029', 'MY_2030', 'MY_2031', 'MY_2032', 'MY_2033', 'MY_2034', 'MY_2035', 'MY_2036');

-- CreateEnum
CREATE TYPE "SupplierClass" AS ENUM ('LARGE_VOLUME_SUPPLIER', 'MEDIUM_VOLUME_SUPPLIER', 'SMALL_VOLUME_SUPPLIER');

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('RECORDS', 'SERVICE');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMINISTRATOR', 'DIRECTOR', 'ORGANIZATION_ADMINISTRATOR', 'SIGNING_AUTHORITY', 'ZEVA_BCEID_USER', 'ZEVA_IDIR_USER', 'ZEVA_IDIR_USER_READ_ONLY');

-- CreateEnum
CREATE TYPE "Idp" AS ENUM ('AZURE_IDIR', 'BCEID_BUSINESS');

-- CreateEnum
CREATE TYPE "Notification" AS ENUM ('CREDIT_APPLICATION', 'CREDIT_TRANSFER', 'MODEL_YEAR_REPORT', 'ZEV_MODEL');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CREDIT', 'DEBIT', 'TRANSFER_AWAY');

-- CreateEnum
CREATE TYPE "ReferenceType" AS ENUM ('AGREEMENT', 'ASSESSMENT_ADJUSTMENT', 'COMPLIANCE_RATIO_REDUCTION', 'PENALTY_CREDITS', 'SUPPLY_CREDITS', 'TRANSFER');

-- CreateEnum
CREATE TYPE "ZevClass" AS ENUM ('A', 'B', 'C', 'UNSPECIFIED');

-- CreateEnum
CREATE TYPE "VehicleClass" AS ENUM ('REPORTABLE');

-- CreateEnum
CREATE TYPE "BalanceType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "CreditTransferStatus" AS ENUM ('APPROVED_BY_GOV', 'APPROVED_BY_TRANSFER_TO', 'RECOMMEND_APPROVAL_GOV', 'RECOMMEND_REJECTION_GOV', 'REJECTED_BY_GOV', 'REJECTED_BY_TRANSFER_TO', 'RESCINDED_BY_TRANSFER_FROM', 'RETURNED_TO_ANALYST', 'SUBMITTED_TO_TRANSFER_TO');

-- CreateEnum
CREATE TYPE "CreditTransferSupplierStatus" AS ENUM ('APPROVED_BY_GOV', 'APPROVED_BY_TRANSFER_TO', 'REJECTED_BY_GOV', 'REJECTED_BY_TRANSFER_TO', 'RESCINDED_BY_TRANSFER_FROM', 'SUBMITTED_TO_TRANSFER_TO');

-- CreateEnum
CREATE TYPE "ZevType" AS ENUM ('BEV', 'EREV', 'FCEV', 'PHEV');

-- CreateEnum
CREATE TYPE "VehicleClassCode" AS ENUM ('COMPACT', 'FULL_SIZE', 'MID_SIZE', 'MINICOMPACT', 'MINIVAN', 'PICKUP_TRUCK_SMALL', 'PICKUP_TRUCK_STANDARD', 'SPECIAL_PURPOSE_VEHICLE', 'SPORT_UTILITY_VEHICLE_SMALL', 'SPORT_UTILITY_VEHICLE_STANDARD', 'STATION_WAGON_MIDSIZE', 'STATION_WAGON_SMALL', 'SUBCOMPACT', 'TWO_SEATER', 'VAN_CARGO', 'VAN_PASSENGER');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('DRAFT', 'RETURNED_TO_SUPPLIER', 'SUBMITTED', 'VALIDATED');

-- CreateEnum
CREATE TYPE "VehicleHistoryStatus" AS ENUM ('RETURNED_TO_SUPPLIER', 'SUBMITTED', 'VALIDATED');

-- CreateEnum
CREATE TYPE "IcbcFileStatus" AS ENUM ('FAILURE', 'PROCESSING', 'SUCCESS');

-- CreateEnum
CREATE TYPE "CreditApplicationStatus" AS ENUM ('APPROVED', 'DRAFT', 'RECOMMEND_APPROVAL', 'RETURNED_TO_ANALYST', 'RETURNED_TO_SUPPLIER', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "CreditApplicationSupplierStatus" AS ENUM ('APPROVED', 'DRAFT', 'RETURNED_TO_SUPPLIER', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "CreditApplicationHistoryStatus" AS ENUM ('APPROVED', 'RECOMMEND_APPROVAL', 'RETURNED_TO_ANALYST', 'RETURNED_TO_SUPPLIER', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "PenaltyCreditStatus" AS ENUM ('APPROVED', 'REJECTED', 'SUBMITTED_TO_DIRECTOR');

-- CreateEnum
CREATE TYPE "AgreementType" AS ENUM ('INITIATIVE', 'PURCHASE');

-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('DRAFT', 'ISSUED', 'RECOMMEND_APPROVAL', 'RETURNED_TO_ANALYST');

-- CreateEnum
CREATE TYPE "AgreementHistoryStatus" AS ENUM ('ISSUED', 'RECOMMEND_APPROVAL', 'RETURNED_TO_ANALYST');

-- CreateEnum
CREATE TYPE "ModelYearReportStatus" AS ENUM ('ASSESSED', 'DRAFT', 'RETURNED_TO_ANALYST', 'RETURNED_TO_SUPPLIER', 'SUBMITTED_TO_DIRECTOR', 'SUBMITTED_TO_GOVERNMENT');

-- CreateEnum
CREATE TYPE "ModelYearReportSupplierStatus" AS ENUM ('ASSESSED', 'DRAFT', 'RETURNED_TO_SUPPLIER', 'SUBMITTED_TO_GOVERNMENT');

-- CreateEnum
CREATE TYPE "ReassessmentStatus" AS ENUM ('DRAFT', 'ISSUED', 'RETURNED_TO_ANALYST', 'SUBMITTED_TO_DIRECTOR');

-- CreateEnum
CREATE TYPE "SupplementaryReportStatus" AS ENUM ('ACKNOWLEDGED', 'DRAFT', 'SUBMITTED');

-- CreateTable
CREATE TABLE "organization" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_government" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "short_name" TEXT NOT NULL,
    "supplier_class" "SupplierClass",

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_address" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "address_type" "AddressType" NOT NULL,
    "expiration_date" DATE,
    "address_lines" TEXT,
    "city" TEXT,
    "postal_code" TEXT,
    "state" TEXT,
    "county" TEXT,
    "country" TEXT,
    "representative" TEXT,

    CONSTRAINT "organization_address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "contact_email" TEXT,
    "idp_sub" TEXT,
    "idp" "Idp" NOT NULL,
    "idp_username" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "organization_id" INTEGER NOT NULL,
    "roles" "Role"[],
    "notifications" "Notification"[],
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zev_unit_transaction" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "type" "TransactionType" NOT NULL,
    "reference_type" "ReferenceType" NOT NULL,
    "reference_id" INTEGER,
    "legacy_reference_id" INTEGER,
    "number_of_units" DECIMAL(65,2) NOT NULL,
    "zev_class" "ZevClass" NOT NULL,
    "vehicle_class" "VehicleClass" NOT NULL,
    "model_year" "ModelYear" NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zev_unit_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zev_unit_ending_balance" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "compliance_year" "ModelYear" NOT NULL,
    "type" "BalanceType" NOT NULL,
    "initial_number_of_units" DECIMAL(65,2) NOT NULL,
    "final_number_of_units" DECIMAL(65,2) NOT NULL,
    "zev_class" "ZevClass" NOT NULL,
    "vehicle_class" "VehicleClass" NOT NULL,
    "model_year" "ModelYear" NOT NULL,

    CONSTRAINT "zev_unit_ending_balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_transfer" (
    "id" SERIAL NOT NULL,
    "transfer_to_id" INTEGER NOT NULL,
    "transfer_from_id" INTEGER NOT NULL,
    "status" "CreditTransferStatus" NOT NULL,
    "supplierStatus" "CreditTransferSupplierStatus" NOT NULL,

    CONSTRAINT "credit_transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_transfer_content" (
    "id" SERIAL NOT NULL,
    "credit_transfer_id" INTEGER NOT NULL,
    "number_of_units" DECIMAL(65,2) NOT NULL,
    "zev_class" "ZevClass" NOT NULL,
    "vehicle_class" "VehicleClass" NOT NULL,
    "model_year" "ModelYear" NOT NULL,
    "dollar_value_per_unit" DECIMAL(65,2) NOT NULL,

    CONSTRAINT "credit_transfer_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_transfer_history" (
    "id" SERIAL NOT NULL,
    "credit_transfer_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_action" "CreditTransferStatus" NOT NULL,
    "comment" TEXT,

    CONSTRAINT "credit_transfer_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle" (
    "id" SERIAL NOT NULL,
    "legacyId" INTEGER,
    "organization_id" INTEGER NOT NULL,
    "status" "VehicleStatus" NOT NULL,
    "make" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "model_year" "ModelYear" NOT NULL,
    "zev_type" "ZevType" NOT NULL,
    "range" INTEGER NOT NULL,
    "vehicle_class" "VehicleClass" NOT NULL,
    "zev_class" "ZevClass" NOT NULL,
    "numberOfUnits" DECIMAL(65,2) NOT NULL,
    "vehicle_class_code" "VehicleClassCode" NOT NULL,
    "weight" INTEGER NOT NULL,
    "us06_range_gte_16" BOOLEAN NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "issued_count" INTEGER NOT NULL DEFAULT 0,
    "submitted_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_history" (
    "id" SERIAL NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_action" "VehicleHistoryStatus" NOT NULL,
    "comment" TEXT,

    CONSTRAINT "vehicle_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_attachment" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "vehicle_id" INTEGER,
    "file_name" TEXT,
    "object_name" TEXT NOT NULL,

    CONSTRAINT "vehicle_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "icbc_file" (
    "id" SERIAL NOT NULL,
    "is_legacy" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "status" "IcbcFileStatus" NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL,
    "number_of_records_pre_processing" INTEGER,
    "number_of_records_post_processing" INTEGER,

    CONSTRAINT "icbc_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "icbc_record" (
    "id" SERIAL NOT NULL,
    "icbc_file_id" INTEGER NOT NULL,
    "vin" VARCHAR(17) NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" "ModelYear" NOT NULL,

    CONSTRAINT "icbc_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_application" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "submission_timestamp" TIMESTAMPTZ(6),
    "transaction_timestamps" TIMESTAMPTZ(6)[],
    "status" "CreditApplicationStatus" NOT NULL,
    "supplier_status" "CreditApplicationSupplierStatus" NOT NULL,
    "model_years" "ModelYear"[],
    "supplier_name" TEXT NOT NULL,
    "makes" TEXT[],
    "service_address" TEXT NOT NULL,
    "records_address" TEXT NOT NULL,
    "eligible_vins_count" INTEGER,
    "ineligible_vins_count" INTEGER,
    "a_credits" DECIMAL(65,2),
    "b_credits" DECIMAL(65,2),
    "icbc_timestamp" TIMESTAMPTZ(6),

    CONSTRAINT "credit_application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_application_history" (
    "id" SERIAL NOT NULL,
    "credit_application_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_action" "CreditApplicationHistoryStatus" NOT NULL,
    "comment" TEXT,

    CONSTRAINT "credit_application_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_application_record" (
    "id" SERIAL NOT NULL,
    "credit_application_id" INTEGER NOT NULL,
    "vin" VARCHAR(17) NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL,
    "vehicle_class" "VehicleClass" NOT NULL,
    "zev_class" "ZevClass" NOT NULL,
    "model_year" "ModelYear" NOT NULL,
    "number_of_units" DECIMAL(65,2) NOT NULL,
    "make" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "zev_type" "ZevType" NOT NULL,
    "range" INTEGER NOT NULL,
    "icbc_make" TEXT,
    "icbc_model_name" TEXT,
    "icbc_model_year" "ModelYear",
    "validated" BOOLEAN NOT NULL,
    "reason" TEXT,
    "warnings" TEXT[],

    CONSTRAINT "credit_application_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_application_attachment" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "credit_application_id" INTEGER,
    "file_name" TEXT,
    "object_name" TEXT NOT NULL,
    "is_application" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "credit_application_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserved_vin" (
    "id" SERIAL NOT NULL,
    "vin" VARCHAR(17) NOT NULL,

    CONSTRAINT "reserved_vin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penalty_credit" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "compliance_year" "ModelYear" NOT NULL,
    "status" "PenaltyCreditStatus" NOT NULL,
    "vehicle_class" "VehicleClass" NOT NULL,
    "zev_class" "ZevClass" NOT NULL,
    "model_year" "ModelYear" NOT NULL,
    "number_of_units" DECIMAL(65,2) NOT NULL,

    CONSTRAINT "penalty_credit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penalty_credit_history" (
    "id" SERIAL NOT NULL,
    "penalty_credit_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_action" "PenaltyCreditStatus" NOT NULL,
    "comment" TEXT,

    CONSTRAINT "penalty_credit_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agreement" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "agreement_type" "AgreementType" NOT NULL,
    "status" "AgreementStatus" NOT NULL,
    "date" TEXT NOT NULL,
    "a_credits" DECIMAL(65,2) NOT NULL,
    "b_credits" DECIMAL(65,2) NOT NULL,

    CONSTRAINT "agreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agreement_content" (
    "id" SERIAL NOT NULL,
    "agreement_id" INTEGER NOT NULL,
    "vehicle_class" "VehicleClass" NOT NULL,
    "zev_class" "ZevClass" NOT NULL,
    "model_year" "ModelYear" NOT NULL,
    "number_of_units" DECIMAL(65,2) NOT NULL,

    CONSTRAINT "agreement_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agreement_history" (
    "id" SERIAL NOT NULL,
    "agreement_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_action" "AgreementHistoryStatus" NOT NULL,
    "comment" TEXT,

    CONSTRAINT "agreement_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agreement_attachment" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "agreement_id" INTEGER,
    "file_name" TEXT,
    "object_name" TEXT NOT NULL,

    CONSTRAINT "agreement_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legacy_sales_volume" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "vehicle_class" "VehicleClass" NOT NULL,
    "model_year" "ModelYear" NOT NULL,
    "volume" INTEGER NOT NULL,

    CONSTRAINT "legacy_sales_volume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supply_volume" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "vehicle_class" "VehicleClass" NOT NULL,
    "model_year" "ModelYear" NOT NULL,
    "volume" INTEGER NOT NULL,

    CONSTRAINT "supply_volume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_year_report" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "model_year" "ModelYear" NOT NULL,
    "status" "ModelYearReportStatus" NOT NULL,
    "supplier_status" "ModelYearReportSupplierStatus" NOT NULL,
    "reassessment_status" "ReassessmentStatus",
    "supplementary_report_status" "SupplementaryReportStatus",
    "object_name" TEXT NOT NULL,
    "forecast_report_object_name" TEXT NOT NULL,
    "forecast_report_file_name" TEXT NOT NULL,
    "compliant" BOOLEAN,
    "reportable_nv_value" INTEGER,
    "supplier_class" "SupplierClass",

    CONSTRAINT "model_year_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment" (
    "id" SERIAL NOT NULL,
    "model_year_report_id" INTEGER NOT NULL,
    "object_name" TEXT NOT NULL,

    CONSTRAINT "assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_year_report_history" (
    "id" SERIAL NOT NULL,
    "model_year_report_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_action" "ModelYearReportStatus" NOT NULL,
    "comment" TEXT,

    CONSTRAINT "model_year_report_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legacy_assessed_model_year_report" (
    "id" SERIAL NOT NULL,
    "legacy_id" INTEGER NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "model_year" "ModelYear" NOT NULL,
    "zev_class_ordering" "ZevClass"[],

    CONSTRAINT "legacy_assessed_model_year_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplementary_report" (
    "id" SERIAL NOT NULL,
    "status" "SupplementaryReportStatus" NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "model_year" "ModelYear" NOT NULL,
    "model_year_report_id" INTEGER,
    "sequence_number" INTEGER NOT NULL,
    "object_name" TEXT NOT NULL,

    CONSTRAINT "supplementary_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplementary_report_history" (
    "id" SERIAL NOT NULL,
    "supplementary_report_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_action" "SupplementaryReportStatus" NOT NULL,
    "comment" TEXT,

    CONSTRAINT "supplementary_report_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reassessment" (
    "id" SERIAL NOT NULL,
    "status" "ReassessmentStatus" NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "model_year" "ModelYear" NOT NULL,
    "model_year_report_id" INTEGER,
    "sequence_number" INTEGER NOT NULL,
    "object_name" TEXT NOT NULL,

    CONSTRAINT "reassessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reassessment_history" (
    "id" SERIAL NOT NULL,
    "reassessment_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_action" "ReassessmentStatus" NOT NULL,
    "comment" TEXT,

    CONSTRAINT "reassessment_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_address_organization_id_address_type_key" ON "organization_address"("organization_id", "address_type");

-- CreateIndex
CREATE UNIQUE INDEX "user_idp_idp_username_key" ON "user"("idp", "idp_username");

-- CreateIndex
CREATE UNIQUE INDEX "zev_unit_ending_balance_organization_id_compliance_year_zev_key" ON "zev_unit_ending_balance"("organization_id", "compliance_year", "zev_class", "vehicle_class", "model_year");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_attachment_object_name_key" ON "vehicle_attachment"("object_name");

-- CreateIndex
CREATE UNIQUE INDEX "icbc_file_name_key" ON "icbc_file"("name");

-- CreateIndex
CREATE UNIQUE INDEX "icbc_record_vin_key" ON "icbc_record"("vin");

-- CreateIndex
CREATE UNIQUE INDEX "credit_application_attachment_object_name_key" ON "credit_application_attachment"("object_name");

-- CreateIndex
CREATE UNIQUE INDEX "reserved_vin_vin_key" ON "reserved_vin"("vin");

-- CreateIndex
CREATE UNIQUE INDEX "agreement_attachment_object_name_key" ON "agreement_attachment"("object_name");

-- CreateIndex
CREATE UNIQUE INDEX "legacy_sales_volume_organization_id_vehicle_class_model_yea_key" ON "legacy_sales_volume"("organization_id", "vehicle_class", "model_year");

-- CreateIndex
CREATE UNIQUE INDEX "supply_volume_organization_id_vehicle_class_model_year_key" ON "supply_volume"("organization_id", "vehicle_class", "model_year");

-- CreateIndex
CREATE UNIQUE INDEX "model_year_report_object_name_key" ON "model_year_report"("object_name");

-- CreateIndex
CREATE UNIQUE INDEX "model_year_report_forecast_report_object_name_key" ON "model_year_report"("forecast_report_object_name");

-- CreateIndex
CREATE UNIQUE INDEX "model_year_report_organization_id_model_year_key" ON "model_year_report"("organization_id", "model_year");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_model_year_report_id_key" ON "assessment"("model_year_report_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_object_name_key" ON "assessment"("object_name");

-- CreateIndex
CREATE UNIQUE INDEX "legacy_assessed_model_year_report_legacy_id_key" ON "legacy_assessed_model_year_report"("legacy_id");

-- CreateIndex
CREATE UNIQUE INDEX "legacy_assessed_model_year_report_organization_id_model_yea_key" ON "legacy_assessed_model_year_report"("organization_id", "model_year");

-- CreateIndex
CREATE UNIQUE INDEX "supplementary_report_object_name_key" ON "supplementary_report"("object_name");

-- CreateIndex
CREATE UNIQUE INDEX "supplementary_report_organization_id_model_year_sequence_nu_key" ON "supplementary_report"("organization_id", "model_year", "sequence_number");

-- CreateIndex
CREATE UNIQUE INDEX "reassessment_object_name_key" ON "reassessment"("object_name");

-- CreateIndex
CREATE UNIQUE INDEX "reassessment_organization_id_model_year_sequence_number_key" ON "reassessment"("organization_id", "model_year", "sequence_number");

-- AddForeignKey
ALTER TABLE "organization_address" ADD CONSTRAINT "organization_address_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zev_unit_transaction" ADD CONSTRAINT "zev_unit_transaction_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zev_unit_ending_balance" ADD CONSTRAINT "zev_unit_ending_balance_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transfer" ADD CONSTRAINT "credit_transfer_transfer_to_id_fkey" FOREIGN KEY ("transfer_to_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transfer" ADD CONSTRAINT "credit_transfer_transfer_from_id_fkey" FOREIGN KEY ("transfer_from_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transfer_content" ADD CONSTRAINT "credit_transfer_content_credit_transfer_id_fkey" FOREIGN KEY ("credit_transfer_id") REFERENCES "credit_transfer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transfer_history" ADD CONSTRAINT "credit_transfer_history_credit_transfer_id_fkey" FOREIGN KEY ("credit_transfer_id") REFERENCES "credit_transfer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transfer_history" ADD CONSTRAINT "credit_transfer_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_history" ADD CONSTRAINT "vehicle_history_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_history" ADD CONSTRAINT "vehicle_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_attachment" ADD CONSTRAINT "vehicle_attachment_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_attachment" ADD CONSTRAINT "vehicle_attachment_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "icbc_record" ADD CONSTRAINT "icbc_record_icbc_file_id_fkey" FOREIGN KEY ("icbc_file_id") REFERENCES "icbc_file"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_application" ADD CONSTRAINT "credit_application_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_application_history" ADD CONSTRAINT "credit_application_history_credit_application_id_fkey" FOREIGN KEY ("credit_application_id") REFERENCES "credit_application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_application_history" ADD CONSTRAINT "credit_application_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_application_record" ADD CONSTRAINT "credit_application_record_credit_application_id_fkey" FOREIGN KEY ("credit_application_id") REFERENCES "credit_application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_application_attachment" ADD CONSTRAINT "credit_application_attachment_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_application_attachment" ADD CONSTRAINT "credit_application_attachment_credit_application_id_fkey" FOREIGN KEY ("credit_application_id") REFERENCES "credit_application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalty_credit" ADD CONSTRAINT "penalty_credit_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalty_credit_history" ADD CONSTRAINT "penalty_credit_history_penalty_credit_id_fkey" FOREIGN KEY ("penalty_credit_id") REFERENCES "penalty_credit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalty_credit_history" ADD CONSTRAINT "penalty_credit_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement" ADD CONSTRAINT "agreement_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_content" ADD CONSTRAINT "agreement_content_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "agreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_history" ADD CONSTRAINT "agreement_history_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "agreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_history" ADD CONSTRAINT "agreement_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_attachment" ADD CONSTRAINT "agreement_attachment_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_attachment" ADD CONSTRAINT "agreement_attachment_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "agreement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legacy_sales_volume" ADD CONSTRAINT "legacy_sales_volume_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supply_volume" ADD CONSTRAINT "supply_volume_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_year_report" ADD CONSTRAINT "model_year_report_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment" ADD CONSTRAINT "assessment_model_year_report_id_fkey" FOREIGN KEY ("model_year_report_id") REFERENCES "model_year_report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_year_report_history" ADD CONSTRAINT "model_year_report_history_model_year_report_id_fkey" FOREIGN KEY ("model_year_report_id") REFERENCES "model_year_report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_year_report_history" ADD CONSTRAINT "model_year_report_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legacy_assessed_model_year_report" ADD CONSTRAINT "legacy_assessed_model_year_report_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplementary_report" ADD CONSTRAINT "supplementary_report_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplementary_report" ADD CONSTRAINT "supplementary_report_model_year_report_id_fkey" FOREIGN KEY ("model_year_report_id") REFERENCES "model_year_report"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplementary_report_history" ADD CONSTRAINT "supplementary_report_history_supplementary_report_id_fkey" FOREIGN KEY ("supplementary_report_id") REFERENCES "supplementary_report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplementary_report_history" ADD CONSTRAINT "supplementary_report_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reassessment" ADD CONSTRAINT "reassessment_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reassessment" ADD CONSTRAINT "reassessment_model_year_report_id_fkey" FOREIGN KEY ("model_year_report_id") REFERENCES "model_year_report"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reassessment_history" ADD CONSTRAINT "reassessment_history_reassessment_id_fkey" FOREIGN KEY ("reassessment_id") REFERENCES "reassessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reassessment_history" ADD CONSTRAINT "reassessment_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

