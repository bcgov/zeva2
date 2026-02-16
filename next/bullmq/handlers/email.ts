import { sendEmail } from "@/app/lib/services/email";
import { getNotificationEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { prisma } from "@/lib/prisma";
import validator from "validator";
import {
  CreditApplicationStatus,
  CreditTransferStatus,
  CreditTransferSupplierStatus,
  ModelYearReportStatus,
  ModelYearReportSupplierStatus,
  Notification,
  Role,
  VehicleStatus,
} from "@/prisma/generated/enums";
import { UserWhereInput } from "@/prisma/generated/models";
import { Job } from "bullmq";

export type EmailJobData = {
  notificationType: Notification;
  historyId: number;
};

export const handleEmailJob = async (job: Job<EmailJobData>) => {
  if (process.env.SEND_NOTIFICATION_EMAILS !== "true") {
    return;
  }
  const data = job.data;
  const notificationType = data.notificationType;
  const historyId = data.historyId;
  if (notificationType === Notification.CREDIT_TRANSFER) {
    await sendCreditTransferEmails(historyId);
  } else if (notificationType === Notification.CREDIT_APPLICATION) {
    await sendCreditApplicationEmails(historyId);
  } else if (notificationType === Notification.MODEL_YEAR_REPORT) {
    await sendModelYearReportEmails(historyId);
  } else if (notificationType === Notification.ZEV_MODEL) {
    await sendZevModelEmails(historyId);
  }
};

export const sendCreditTransferEmails = async (historyId: number) => {
  const history = await prisma.creditTransferHistory.findUnique({
    where: {
      id: historyId,
    },
    select: {
      userId: true,
      userAction: true,
      creditTransfer: {
        select: {
          id: true,
          transferFromId: true,
          transferToId: true,
        },
      },
    },
  });
  if (!history) {
    throw new Error(`Credit transfer history ${historyId} not found!`);
  }
  const userAction = history.userAction;
  const supplierOrgIds: number[] = [];
  let includeAnalysts: boolean = false;
  let includeDirector: boolean = false;
  if (
    Object.values(CreditTransferSupplierStatus).some(
      (status) => status === userAction,
    )
  ) {
    supplierOrgIds.push(
      history.creditTransfer.transferFromId,
      history.creditTransfer.transferToId,
    );
  }
  if (
    userAction === CreditTransferStatus.APPROVED_BY_TRANSFER_TO ||
    userAction === CreditTransferStatus.RETURNED_TO_ANALYST
  ) {
    includeAnalysts = true;
  } else if (
    userAction === CreditTransferStatus.RECOMMEND_APPROVAL_GOV ||
    userAction === CreditTransferStatus.RECOMMEND_REJECTION_GOV
  ) {
    includeDirector = true;
  }
  await sendNotificationEmails(
    Notification.CREDIT_TRANSFER,
    history.creditTransfer.id,
    history.userId,
    supplierOrgIds,
    includeAnalysts,
    includeDirector,
  );
};

export const sendCreditApplicationEmails = async (historyId: number) => {
  const history = await prisma.creditApplicationHistory.findUnique({
    where: {
      id: historyId,
    },
    select: {
      userId: true,
      userAction: true,
      creditApplication: {
        select: {
          id: true,
          organizationId: true,
        },
      },
    },
  });
  if (!history) {
    throw new Error(`Credit application history ${historyId} not found!`);
  }
  const userAction = history.userAction;
  const supplierOrgIds: number[] = [];
  let includeAnalysts: boolean = false;
  let includeDirector: boolean = false;
  if (
    userAction === CreditApplicationStatus.SUBMITTED ||
    userAction === CreditApplicationStatus.RETURNED_TO_SUPPLIER ||
    userAction === CreditApplicationStatus.APPROVED
  ) {
    supplierOrgIds.push(history.creditApplication.organizationId);
  }
  if (
    userAction === CreditApplicationStatus.SUBMITTED ||
    userAction === CreditApplicationStatus.RETURNED_TO_ANALYST
  ) {
    includeAnalysts = true;
  } else if (userAction === CreditApplicationStatus.RECOMMEND_APPROVAL) {
    includeDirector = true;
  }
  await sendNotificationEmails(
    Notification.CREDIT_APPLICATION,
    history.creditApplication.id,
    history.userId,
    supplierOrgIds,
    includeAnalysts,
    includeDirector,
  );
};

export const sendModelYearReportEmails = async (historyId: number) => {
  const history = await prisma.modelYearReportHistory.findUnique({
    where: {
      id: historyId,
    },
    select: {
      userId: true,
      userAction: true,
      modelYearReport: {
        select: {
          id: true,
          organizationId: true,
        },
      },
    },
  });
  if (!history) {
    throw new Error(`Model Year Report history ${historyId} not found!`);
  }
  const userAction = history.userAction;
  const supplierOrgIds: number[] = [];
  let includeAnalysts: boolean = false;
  let includeDirector: boolean = false;
  if (
    Object.values(ModelYearReportSupplierStatus).some(
      (status) => status === userAction,
    )
  ) {
    supplierOrgIds.push(history.modelYearReport.organizationId);
  }
  if (
    userAction === ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT ||
    userAction === ModelYearReportStatus.RETURNED_TO_ANALYST
  ) {
    includeAnalysts = true;
  } else if (userAction === ModelYearReportStatus.SUBMITTED_TO_DIRECTOR) {
    includeDirector = true;
  }
  await sendNotificationEmails(
    Notification.MODEL_YEAR_REPORT,
    history.modelYearReport.id,
    history.userId,
    supplierOrgIds,
    includeAnalysts,
    includeDirector,
  );
};

export const sendZevModelEmails = async (historyId: number) => {
  const history = await prisma.vehicleHistory.findUnique({
    where: {
      id: historyId,
    },
    select: {
      userId: true,
      userAction: true,
      vehicle: {
        select: {
          id: true,
          organizationId: true,
        },
      },
    },
  });
  if (!history) {
    throw new Error(`Vehicle history ${historyId} not found!`);
  }
  const userAction = history.userAction;
  const supplierOrgIds: number[] = [];
  let includeAnalysts: boolean = false;
  if (
    userAction === VehicleStatus.SUBMITTED ||
    userAction === VehicleStatus.RETURNED_TO_SUPPLIER ||
    userAction === VehicleStatus.VALIDATED
  ) {
    supplierOrgIds.push(history.vehicle.organizationId);
  }
  if (userAction === VehicleStatus.SUBMITTED) {
    includeAnalysts = true;
  }
  await sendNotificationEmails(
    Notification.ZEV_MODEL,
    history.vehicle.id,
    history.userId,
    supplierOrgIds,
    includeAnalysts,
    false,
  );
};

export const sendNotificationEmails = async (
  notificationType: Notification,
  objectId: number,
  originatingUserId: number,
  supplierOrgIds: number[],
  includeAnalysts: boolean,
  includeDirector: boolean,
) => {
  const orClause: UserWhereInput[] = [
    {
      organizationId: {
        in: supplierOrgIds,
      },
    },
  ];
  if (includeAnalysts) {
    orClause.push({
      organization: {
        isGovernment: true,
      },
      roles: {
        has: Role.ZEVA_IDIR_USER,
      },
    });
  }
  if (includeDirector) {
    orClause.push({
      organization: {
        isGovernment: true,
      },
      roles: {
        has: Role.DIRECTOR,
      },
    });
  }
  const users = await prisma.user.findMany({
    where: {
      NOT: {
        id: originatingUserId,
      },
      notifications: {
        has: notificationType,
      },
      OR: orClause,
    },
    select: {
      contactEmail: true,
    },
  });
  const emails: Set<string> = new Set();
  users.forEach((user) => {
    const email = user.contactEmail;
    if (email && email === email.trim() && validator.isEmail(email)) {
      emails.add(email);
    }
  });
  if (emails.size > 0) {
    const emailBody = getNotificationEmailBody(notificationType, objectId);
    const success = await sendEmail(
      Array.from(emails),
      "BC ZEVA Notification",
      "html",
      emailBody,
    );
    if (!success) {
      throw new Error("Notification(s) not sent successfully!");
    }
  }
};

export const getNotificationEmailBody = (
  notificationType: Notification,
  objectId: number,
): string => {
  const notificationsMap = getNotificationEnumsToStringsMap();
  return `
    <html>
      <body>
        <p>This email was generated by the Government of B.C. Zero-Emission Vehicle Reporting System.</p>
        <p>Within the Zero-Emission Vehicle Reporting System, an event has occurred pertaining to the ${notificationsMap[notificationType]} with ID ${objectId}.</p>
        <p>For further details, or to unsubscribe from these notifications, please visit <a href=${process.env.ZEVA_URL}>${process.env.ZEVA_URL}</a>.</p>
      </body>
    </html>
  `;
};
