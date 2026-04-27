"use server";

import {
  DataActionResponse,
  getDataActionResponse,
} from "@/app/lib/utils/actionResponse";
import { getUserInfo } from "@/auth";
import { Item } from "./constants";
import {
  getSupplierCaActionRequiredItems,
  getSupplierCaForAwarenessItems,
  getSupplierCaInProgressItems,
  getSupplierCtActionRequiredItems,
  getSupplierCtForAwarenessItems,
  getSupplierCtInProgressItems,
  getSupplierMyrActionRequiredItems,
  getSupplierMyrForAwarenessItems,
  getSupplierMyrInProgressItems,
  getSupplierZevModelActionRequiredItems,
  getSupplierZevModelForAwarenessItems,
  getSupplierZevModelInProgressItems,
} from "./services";

export const supplierGetActionRequiredItems = async (
  key: string,
  idsToExclude: number[],
): Promise<DataActionResponse<Item[]>> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov) {
    return getDataActionResponse([]);
  }
  if (key === "Model Year Reports") {
    const items = await getSupplierMyrActionRequiredItems(
      userOrgId,
      idsToExclude,
    );
    return getDataActionResponse(items);
  } else if (key === "Credit Applications") {
    const items = await getSupplierCaActionRequiredItems(
      userOrgId,
      idsToExclude,
    );
    return getDataActionResponse(items);
  } else if (key === "ZEV Models") {
    const items = await getSupplierZevModelActionRequiredItems(
      userOrgId,
      idsToExclude,
    );
    return getDataActionResponse(items);
  } else if (key === "Credit Transfers") {
    const items = await getSupplierCtActionRequiredItems(
      userOrgId,
      idsToExclude,
    );
    return getDataActionResponse(items);
  }
  return getDataActionResponse([]);
};

export const supplierGetInProgressItems = async (
  key: string,
  idsToExclude: number[],
): Promise<DataActionResponse<Item[]>> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov) {
    return getDataActionResponse([]);
  }
  if (key === "Model Year Reports") {
    const items = await getSupplierMyrInProgressItems(userOrgId, idsToExclude);
    return getDataActionResponse(items);
  } else if (key === "Credit Applications") {
    const items = await getSupplierCaInProgressItems(userOrgId, idsToExclude);
    return getDataActionResponse(items);
  } else if (key === "ZEV Models") {
    const items = await getSupplierZevModelInProgressItems(
      userOrgId,
      idsToExclude,
    );
    return getDataActionResponse(items);
  } else if (key === "Credit Transfers") {
    const items = await getSupplierCtInProgressItems(userOrgId, idsToExclude);
    return getDataActionResponse(items);
  }
  return getDataActionResponse([]);
};

export const supplierGetForAwarenessItems = async (
  key: string,
  idsToExclude: number[],
): Promise<DataActionResponse<Item[]>> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov) {
    return getDataActionResponse([]);
  }
  if (key === "Model Year Reports") {
    const items = await getSupplierMyrForAwarenessItems(
      userOrgId,
      idsToExclude,
    );
    return getDataActionResponse(items);
  } else if (key === "Credit Applications") {
    const items = await getSupplierCaForAwarenessItems(userOrgId, idsToExclude);
    return getDataActionResponse(items);
  } else if (key === "ZEV Models") {
    const items = await getSupplierZevModelForAwarenessItems(
      userOrgId,
      idsToExclude,
    );
    return getDataActionResponse(items);
  } else if (key === "Credit Transfers") {
    const items = await getSupplierCtForAwarenessItems(userOrgId, idsToExclude);
    return getDataActionResponse(items);
  }
  return getDataActionResponse([]);
};
