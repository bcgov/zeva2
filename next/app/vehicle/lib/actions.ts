"use server";

import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  VehicleStatus,
  Vehicle,
  Prisma,
  Notification,
  ZevClass,
  Role,
  CreditApplicationStatus,
} from "@/prisma/generated/client";
import {
  createHistory,
  getConflictingVehicle,
  deleteAttachments,
  updateAttachments,
} from "./services";
import {
  DataOrErrorActionResponse,
  ErrorOrSuccessActionResponse,
  getDataActionResponse,
  getErrorActionResponse,
  getSuccessActionResponse,
} from "@/app/lib/utils/actionResponse";
import { getPresignedGetObjectUrl } from "@/app/lib/minio";
import { getVehicleClass, getZevClass, getNumberOfUnits } from "./utilsServer";
import {
  Attachment,
  AttachmentDownload,
  checkAttachments,
  getPutObjectData,
} from "@/app/lib/services/attachments";
import { addJobToEmailQueue } from "@/app/lib/services/queue";

export const getVehicleAttachmentsPutData = async (numberOfFiles: number) => {
  const { userOrgId } = await getUserInfo();
  return await getPutObjectData(numberOfFiles, "vehicle", userOrgId);
};

export type VehiclePayload = Omit<
  Vehicle,
  | "id"
  | "legacyId"
  | "organizationId"
  | "status"
  | "isActive"
  | "vehicleClass"
  | "zevClass"
  | "numberOfUnits"
  | "issuedCount"
  | "submittedCount"
>;

export const supplierSave = async (
  data: VehiclePayload,
  attachments: Attachment[],
  vehicleId?: number,
): Promise<DataOrErrorActionResponse<number>> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  if (vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({
      where: {
        id: vehicleId,
        organizationId: userOrgId,
        status: {
          in: [VehicleStatus.DRAFT, VehicleStatus.RETURNED_TO_SUPPLIER],
        },
      },
      select: {
        id: true,
      },
    });
    if (!vehicle) {
      return getErrorActionResponse("Invalid Action!");
    }
  }
  const modelYear = data.modelYear;
  const range = data.range;
  let zevModelId = vehicleId ?? Number.NaN;
  try {
    await checkAttachments(attachments, "vehicle", userOrgId);
    const vehicleClass = getVehicleClass(modelYear, data.weight);
    const zevClass = getZevClass(modelYear, data.zevType, range);
    const us06RangeGte16 = data.us06RangeGte16;
    if (us06RangeGte16 && zevClass !== ZevClass.B) {
      throw new Error(
        "Additional 0.2 US06 credit applies only to ZEV Class B vehicles!",
      );
    }
    if (us06RangeGte16 && attachments.length === 0) {
      throw new Error("At least one file is required!");
    }
    const numberOfUnits = getNumberOfUnits(
      zevClass,
      range,
      data.us06RangeGte16,
    );
    const dataToSave = {
      ...data,
      organizationId: userOrgId,
      status: VehicleStatus.DRAFT,
      isActive: false,
      vehicleClass,
      zevClass,
      numberOfUnits,
    };
    await prisma.$transaction(async (tx) => {
      if (vehicleId) {
        await tx.vehicle.update({
          where: {
            id: vehicleId,
          },
          data: dataToSave,
        });
      } else {
        const newVehicle = await tx.vehicle.create({
          data: dataToSave,
          select: {
            id: true,
          },
        });
        zevModelId = newVehicle.id;
      }
      await deleteAttachments(zevModelId, tx);
      await updateAttachments(zevModelId, attachments, tx);
    });
  } catch (e) {
    if (e instanceof Error) {
      return getErrorActionResponse(e.message);
    }
    throw e;
  }
  return getDataActionResponse<number>(zevModelId);
};

export async function supplierSubmit(
  vehicleId: number,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> {
  const { userIsGov, userId, userOrgId, userRoles } = await getUserInfo();
  if (userIsGov || !userRoles.includes(Role.ZEVA_BCEID_USER)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const vehicle = await prisma.vehicle.findUnique({
    where: {
      id: vehicleId,
      organizationId: userOrgId,
      status: {
        in: [VehicleStatus.DRAFT, VehicleStatus.RETURNED_TO_SUPPLIER],
      },
    },
  });
  if (!vehicle) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.$transaction(async (tx) => {
    await tx.vehicle.update({
      where: {
        id: vehicleId,
      },
      data: {
        status: VehicleStatus.SUBMITTED,
      },
    });
    const historyId = await createHistory(
      vehicleId,
      userId,
      VehicleStatus.SUBMITTED,
      comment,
    );
    await addJobToEmailQueue({
      historyId,
      notificationType: Notification.ZEV_MODEL,
    });
  });
  return getSuccessActionResponse();
}

export const supplierDelete = async (
  vehicleId: number,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  const vehicle = await prisma.vehicle.findUnique({
    where: {
      id: vehicleId,
      organizationId: userOrgId,
      status: {
        in: [
          VehicleStatus.DRAFT,
          VehicleStatus.REJECTED,
          VehicleStatus.RETURNED_TO_SUPPLIER,
        ],
      },
    },
  });
  if (!vehicle) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.$transaction(async (tx) => {
    await tx.vehicle.update({
      where: {
        id: vehicleId,
      },
      data: {
        status: VehicleStatus.DELETED,
      },
    });
  });
  return getSuccessActionResponse();
};

export const supplierActivate = async (
  vehicleId: number,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  const vehicle = await prisma.vehicle.findUnique({
    where: {
      id: vehicleId,
      organizationId: userOrgId,
      isActive: false,
      status: VehicleStatus.VALIDATED,
    },
  });
  if (!vehicle) {
    return getErrorActionResponse("Invalid Action!");
  }
  const conflictingVehicle = await getConflictingVehicle(
    userOrgId,
    vehicle.make,
    vehicle.modelName,
    vehicle.modelYear,
  );
  if (conflictingVehicle) {
    return getErrorActionResponse(
      `Activating this vehicle would cause a conflict with vehicle #${conflictingVehicle.id}`,
    );
  }
  await prisma.vehicle.update({
    where: {
      id: vehicleId,
    },
    data: {
      isActive: true,
    },
  });
  return getSuccessActionResponse();
};

export const supplierDeactivate = async (
  vehicleId: number,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  const vehicle = await prisma.vehicle.findUnique({
    where: {
      id: vehicleId,
      organizationId: userOrgId,
      isActive: true,
      status: VehicleStatus.VALIDATED,
    },
  });
  if (!vehicle) {
    return getErrorActionResponse("Invalid Action!");
  }
  const outstandingCreditApplicationRecord =
    await prisma.creditApplicationRecord.findFirst({
      where: {
        creditApplication: {
          organizationId: userOrgId,
          status: {
            in: [
              CreditApplicationStatus.SUBMITTED,
              CreditApplicationStatus.RECOMMEND_APPROVAL,
              CreditApplicationStatus.RETURNED_TO_ANALYST,
            ],
          },
        },
        make: vehicle.make,
        modelName: vehicle.modelName,
        modelYear: vehicle.modelYear,
      },
      select: {
        creditApplicationId: true,
      },
    });
  if (outstandingCreditApplicationRecord) {
    return getErrorActionResponse(
      `Cannot deactivate this vehicle because outstanding CA #${outstandingCreditApplicationRecord.creditApplicationId} contains this vehicle!`,
    );
  }
  await prisma.vehicle.update({
    where: {
      id: vehicleId,
    },
    data: {
      isActive: false,
    },
  });
  return getSuccessActionResponse();
};

export const analystUpdate = async (
  vehicleId: number,
  newStatus:
    | typeof VehicleStatus.REJECTED
    | typeof VehicleStatus.RETURNED_TO_SUPPLIER
    | typeof VehicleStatus.VALIDATED,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userId, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const vehicle = await prisma.vehicle.findUnique({
    where: {
      id: vehicleId,
      status: VehicleStatus.SUBMITTED,
    },
  });
  if (!vehicle) {
    return getErrorActionResponse("Invalid Action!");
  }
  if (newStatus === VehicleStatus.VALIDATED) {
    const conflictingVehicle = await getConflictingVehicle(
      vehicle.organizationId,
      vehicle.make,
      vehicle.modelName,
      vehicle.modelYear,
    );
    if (conflictingVehicle) {
      return getErrorActionResponse(
        `Validating this vehicle would cause a conflict with vehicle #${conflictingVehicle.id}`,
      );
    }
  }
  await prisma.$transaction(async (tx) => {
    await tx.vehicle.update({
      where: {
        id: vehicleId,
      },
      data: {
        status: newStatus,
        ...(newStatus === VehicleStatus.VALIDATED && { isActive: true }),
      },
    });
    const historyId = await createHistory(
      vehicleId,
      userId,
      newStatus,
      comment,
      tx,
    );
    await addJobToEmailQueue({
      historyId,
      notificationType: Notification.ZEV_MODEL,
    });
  });
  return getSuccessActionResponse();
};

export const getAttachmentDownloadUrls = async (
  id: number,
): Promise<DataOrErrorActionResponse<AttachmentDownload[]>> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const whereClause: Prisma.VehicleAttachmentWhereInput = {
    vehicleId: id,
    fileName: { not: null },
  };
  if (!userIsGov) {
    whereClause.vehicle = {
      organizationId: userOrgId,
      status: {
        not: VehicleStatus.DELETED,
      },
    };
  } else {
    whereClause.vehicle = {
      status: {
        notIn: [
          VehicleStatus.DELETED,
          VehicleStatus.DRAFT,
          VehicleStatus.REJECTED,
          VehicleStatus.RETURNED_TO_SUPPLIER,
        ],
      },
    };
  }
  const attachments = await prisma.vehicleAttachment.findMany({
    where: whereClause,
    select: {
      fileName: true,
      objectName: true,
    },
  });
  if (attachments.length === 0) {
    return getErrorActionResponse("No attachments found!");
  }
  const result: AttachmentDownload[] = [];
  for (const attachment of attachments) {
    if (attachment.fileName) {
      result.push({
        fileName: attachment.fileName,
        url: await getPresignedGetObjectUrl(attachment.objectName),
      });
    }
  }
  return getDataActionResponse(result);
};
