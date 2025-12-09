import _ from "lodash";
import {AppError} from "../errors/errors.js";

export const minToSec = (date?: number) => {
  if (!date) {
    return date;
  }
  return date * 1000;
};

export const SecToMin = (date?: string) => {
  if (!date) {
    return undefined;
  }
  return parseInt((parseInt(date) / 1000).toString()).toString();
};

export const centsToDollar = (cents?: number) => {
  if (!cents) {
    return undefined;
  }

  return cents / 100;
};

export const getCustomerName = (id: string, firstName?: string, lastName?: string, email?: string) => {
  if (!_.isEmpty(firstName) && !_.isEmpty(lastName)) {
    return `${firstName} ${lastName}`;
  }
  if (!_.isEmpty(email)) {
    return email;
  }

  return id;
};

export const validateSubdomainInput = (site?: string) => {
  if (!site || _.isEmpty(site.trim())) {
    throw new AppError({
      statusCode: 400,
      message: "Site is empty",
    });
  }
  const trimmedInput = site.trim();

  // Check if it looks like a URL
  if (trimmedInput.includes("://") || trimmedInput.includes(".")) {
    const url = new URL(trimmedInput.startsWith("http") ? trimmedInput : `https://${trimmedInput}`);
    if (url.hostname.endsWith(".chargebee.com")) {
      const suggestion = url.hostname.replace(".chargebee.com", "");
      throw new AppError({
        statusCode: 400,
        message: `Please enter just the subdomain instead of the full URL (suggestion: '${suggestion}')`,
      });
    }
  }
};

export const parseId = (id: string) => {
  return `|${id}|`;
};

export const parseIdWithVersion = (versionNumber: number, id?: string) => {
  if (_.isUndefined(id)) {
    return undefined;
  }

  if (versionNumber === 1) {
    return id;
  }

  return parseId(id);
};

export const parseEntityIdForComment = (entityType: string, versionNumber: number, id?: string) => {
  if (entityType === "invoice" || entityType === "credit_note") {
    return parseIdWithVersion(versionNumber, id);
  }

  return id;
};
