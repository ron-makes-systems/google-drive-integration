import {createGoogleDriveApi} from "../api/googleDrive.js";
import {ValidationError} from "../errors/errors.js";
import {IntegrationAccount} from "../types/types.authentication.js";
import {logger} from "../infra/logger.js";

const SHARE_ACTIONS = ["share-drive", "share-folder", "share-file"];
const UPLOAD_FILE_ACTION = "upload-file";
const CREATE_FOLDER_ACTION = "create-folder";

export type ActionArgs = {
  resourceId?: string;
  // Share action args
  emails?: string;
  role?: string;
  sendNotification?: string;
  // Unshare action args
  permissionId?: string;
  // Upload file action args
  fileName?: string;
  driveId?: string;
  folderId?: string;
  file?: unknown;
  files?: unknown;
  // Create folder action args
  folderName?: string;
  parentFolderId?: string;
};

export const executeAction = async (account: IntegrationAccount, action: string, args: ActionArgs): Promise<void> => {
  if (SHARE_ACTIONS.includes(action)) {
    await executeShareAction(account, args);
  } else if (action === UPLOAD_FILE_ACTION) {
    await executeUploadFileAction(account, args);
  } else if (action === CREATE_FOLDER_ACTION) {
    await executeCreateFolderAction(account, args);
  } else if (action === "unshare") {
    await executeUnshareAction(account, args);
  } else {
    throw new ValidationError(`Unknown action: ${action}`);
  }
};

const executeShareAction = async (account: IntegrationAccount, args: ActionArgs): Promise<void> => {
  const {resourceId, emails, role, sendNotification} = args;

  if (!resourceId) {
    throw new ValidationError(`"resourceId" is required`);
  }
  if (!emails) {
    throw new ValidationError(`"emails" is required`);
  }
  if (!role) {
    throw new ValidationError(`"role" is required`);
  }

  // Parse comma-separated emails
  const emailList = emails
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (emailList.length === 0) {
    throw new ValidationError(`No valid email addresses provided`);
  }

  // Map user-friendly role names to API values
  const roleMapping: Record<string, string> = {
    viewer: "reader",
    commenter: "commenter",
    editor: "writer",
    "content manager": "fileOrganizer",
    manager: "organizer",
    // Also accept API values directly
    reader: "reader",
    writer: "writer",
    fileorganizer: "fileOrganizer",
    organizer: "organizer",
  };

  const normalizedRole = role.toLowerCase();
  const apiRole = roleMapping[normalizedRole];

  if (!apiRole) {
    throw new ValidationError(
      `Invalid role "${role}". Valid roles: Viewer, Commenter, Editor, Content Manager, Manager`,
    );
  }

  const notify = sendNotification !== "false";
  const api = createGoogleDriveApi(account);

  logger.info(`Sharing resource ${resourceId} with ${emailList.length} users as ${apiRole}`);

  // Create permission for each email
  for (const email of emailList) {
    try {
      await api.createPermission({
        fileId: resourceId,
        type: "user",
        role: apiRole,
        emailAddress: email,
        sendNotificationEmail: notify,
      });
      logger.info(`Shared ${resourceId} with ${email} as ${apiRole}`);
    } catch (error) {
      logger.error(`Failed to share ${resourceId} with ${email}:`, {error});
      throw error;
    }
  }
};

const executeUnshareAction = async (account: IntegrationAccount, args: ActionArgs): Promise<void> => {
  const {resourceId, permissionId} = args;

  if (!resourceId) {
    throw new ValidationError(`"resourceId" is required`);
  }
  if (!permissionId) {
    throw new ValidationError(`"permissionId" is required`);
  }

  const api = createGoogleDriveApi(account);

  logger.info(`Removing permission ${permissionId} from resource ${resourceId}`);

  try {
    await api.deletePermission({
      fileId: resourceId,
      permissionId,
    });
    logger.info(`Removed permission ${permissionId} from ${resourceId}`);
  } catch (error) {
    logger.error(`Failed to remove permission ${permissionId} from ${resourceId}:`, {error});
    throw error;
  }
};

const executeUploadFileAction = async (account: IntegrationAccount, args: ActionArgs): Promise<void> => {
  const {fileName, driveId, folderId, file, files} = args;

  if (!fileName) {
    throw new ValidationError(`"fileName" is required`);
  }
  if (!driveId) {
    throw new ValidationError(`"driveId" is required`);
  }
  const resolvedFolderId = resolveDriveRoot(driveId, folderId);

  const fileInputs = normalizeFiberyFiles(file ?? files);
  if (fileInputs.length === 0) {
    throw new ValidationError(`"file" is required`);
  }
  if (fileInputs.length > 1) {
    throw new ValidationError(`Only one file is supported for "file"`);
  }

  const [fileInput] = fileInputs;
  const {content, mimeType} = await downloadFiberyFile(fileInput);

  const api = createGoogleDriveApi(account);

  logger.info(`Uploading file "${fileName}" to folder ${resolvedFolderId} (drive ${driveId})`);

  await api.uploadFile({
    name: fileName,
    parentFolderId: resolvedFolderId,
    mimeType,
    content,
  });
};

const executeCreateFolderAction = async (account: IntegrationAccount, args: ActionArgs): Promise<void> => {
  const {driveId, parentFolderId, folderName} = args;

  if (!driveId) {
    throw new ValidationError(`"driveId" is required`);
  }
  if (!folderName) {
    throw new ValidationError(`"folderName" is required`);
  }
  const resolvedParentFolderId = resolveDriveRoot(driveId, parentFolderId);

  const api = createGoogleDriveApi(account);

  logger.info(`Creating folder "${folderName}" in parent ${resolvedParentFolderId} (drive ${driveId})`);

  await api.createFolder({
    name: folderName,
    parentFolderId: resolvedParentFolderId,
  });
};

const resolveDriveRoot = (driveId: string, folderId?: string): string => {
  const trimmedFolderId = folderId?.trim();
  if (!trimmedFolderId) {
    return driveId === "root" ? "root" : driveId;
  }
  if (trimmedFolderId === "root" && driveId !== "root") {
    return driveId;
  }
  return trimmedFolderId;
};

const normalizeFiberyFiles = (input: unknown): Array<{url: string; name?: string; mimeType?: string}> => {
  if (!input) {
    return [];
  }

  const asFile = (value: unknown): {url: string; name?: string; mimeType?: string} | null => {
    if (typeof value === "string") {
      return {url: value};
    }
    if (!value || typeof value !== "object") {
      return null;
    }
    const record = value as Record<string, unknown>;
    const url =
      (typeof record.url === "string" && record.url) ||
      (typeof record.downloadUrl === "string" && record.downloadUrl) ||
      (typeof record.link === "string" && record.link) ||
      (typeof record.href === "string" && record.href) ||
      (typeof record.download_url === "string" && record.download_url) ||
      "";

    if (!url) {
      return null;
    }

    const name =
      (typeof record.name === "string" && record.name) ||
      (typeof record.fileName === "string" && record.fileName) ||
      (typeof record.filename === "string" && record.filename) ||
      undefined;

    const mimeType =
      (typeof record.mimeType === "string" && record.mimeType) ||
      (typeof record.contentType === "string" && record.contentType) ||
      undefined;

    return {url, name, mimeType};
  };

  if (Array.isArray(input)) {
    return input.map(asFile).filter((value): value is {url: string; name?: string; mimeType?: string} => !!value);
  }

  const single = asFile(input);
  return single ? [single] : [];
};

const downloadFiberyFile = async (file: {
  url: string;
  name?: string;
  mimeType?: string;
}): Promise<{content: Buffer; mimeType?: string}> => {
  const response = await fetch(file.url);

  if (!response.ok) {
    throw new ValidationError(`Failed to download file from Fibery: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const headerType = response.headers.get("content-type") || undefined;

  return {
    content: Buffer.from(arrayBuffer),
    mimeType: file.mimeType || headerType,
  };
};
