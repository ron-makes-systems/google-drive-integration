import {google, drive_v3} from "googleapis";
import pLimit from "p-limit";
import {Response} from "express";
import {IntegrationAccount} from "../types/types.authentication.js";
import {config} from "../config.js";
import {AppError} from "../errors/errors.js";
import {GoogleDriveMetadata, GoogleFileMetadata, GooglePermission, GoogleUser} from "../types/types.googleDrive.js";

const limit = pLimit(config.maxConcurrentConnections);

// MIME types for Google Workspace files
export const GOOGLE_WORKSPACE_MIME_TYPES = {
  FOLDER: "application/vnd.google-apps.folder",
  DOCUMENT: "application/vnd.google-apps.document",
  SPREADSHEET: "application/vnd.google-apps.spreadsheet",
  PRESENTATION: "application/vnd.google-apps.presentation",
  DRAWING: "application/vnd.google-apps.drawing",
  FORM: "application/vnd.google-apps.form",
  SHORTCUT: "application/vnd.google-apps.shortcut",
} as const;

export const EXPORTABLE_MIME_TYPES = [
  GOOGLE_WORKSPACE_MIME_TYPES.DOCUMENT,
  GOOGLE_WORKSPACE_MIME_TYPES.SPREADSHEET,
  GOOGLE_WORKSPACE_MIME_TYPES.PRESENTATION,
] as const;

export const createGoogleDriveApi = (account: IntegrationAccount) => {
  const oauth2Client = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri,
  );

  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
  });

  const drive = google.drive({version: "v3", auth: oauth2Client});

  const call = async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
      return await limit(operation);
    } catch (error: unknown) {
      const e = error as {code?: number; message?: string; errors?: Array<{message: string}>};
      const message = e.errors?.[0]?.message || e.message || "Google Drive API error";
      throw new AppError({
        statusCode: e.code || 500,
        message,
        tryLater: e.code === 429 || e.code === 403,
      });
    }
  };

  // Validate connection and get current user
  const validate = async (): Promise<GoogleUser> => {
    const response = await call(() =>
      drive.about.get({
        fields: "user(displayName, emailAddress, permissionId, photoLink)",
      }),
    );
    return response.data.user as GoogleUser;
  };

  // Get current user
  const getCurrentUser = async (): Promise<GoogleUser> => {
    return validate();
  };

  // List shared drives
  const listSharedDrives = async ({
    pageSize = 100,
    pageToken,
  }: {
    pageSize?: number;
    pageToken?: string;
  }): Promise<{drives: GoogleDriveMetadata[]; nextPageToken?: string}> => {
    const response = await call(() =>
      drive.drives.list({
        pageSize,
        pageToken,
        fields: "nextPageToken, drives(id, name, colorRgb, createdTime, capabilities, restrictions)",
      }),
    );
    return {
      drives: (response.data.drives || []) as GoogleDriveMetadata[],
      nextPageToken: response.data.nextPageToken || undefined,
    };
  };

  // Get My Drive root
  const getMyDriveRoot = async (): Promise<{id: string; name: string}> => {
    const response = await call(() =>
      drive.files.get({
        fileId: "root",
        fields: "id, name",
      }),
    );
    return {id: response.data.id!, name: "My Drive"};
  };

  // List files with query
  const listFiles = async ({
    query,
    driveId,
    pageSize = 1000,
    pageToken,
    fields,
    orderBy = "modifiedTime desc",
  }: {
    query: string;
    driveId?: string;
    pageSize?: number;
    pageToken?: string;
    fields?: string;
    orderBy?: string;
  }): Promise<{files: GoogleFileMetadata[]; nextPageToken?: string}> => {
    const params: drive_v3.Params$Resource$Files$List = {
      q: query,
      pageSize,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      fields:
        fields ||
        "nextPageToken, files(id, name, mimeType, description, createdTime, modifiedTime, size, webViewLink, iconLink, thumbnailLink, parents, driveId, owners, lastModifyingUser, trashed, ownedByMe, shared)",
      orderBy,
    };

    if (driveId && driveId !== "root") {
      params.corpora = "drive";
      params.driveId = driveId;
    }

    const response = await call(() => drive.files.list(params));
    return {
      files: (response.data.files || []) as GoogleFileMetadata[],
      nextPageToken: response.data.nextPageToken || undefined,
    };
  };

  // List folders
  const listFolders = async (options: {
    driveId?: string;
    parentId?: string;
    modifiedAfter?: string;
    pageToken?: string;
  }) => {
    let query = `mimeType = '${GOOGLE_WORKSPACE_MIME_TYPES.FOLDER}' and trashed = false`;
    if (options.parentId) {
      query += ` and '${options.parentId}' in parents`;
    }
    if (options.modifiedAfter) {
      query += ` and modifiedTime > '${options.modifiedAfter}'`;
    }
    return listFiles({
      query,
      driveId: options.driveId,
      pageToken: options.pageToken,
    });
  };

  // List non-folder files
  const listNonFolderFiles = async (options: {
    driveId?: string;
    parentId?: string;
    modifiedAfter?: string;
    pageToken?: string;
  }) => {
    let query = `mimeType != '${GOOGLE_WORKSPACE_MIME_TYPES.FOLDER}' and trashed = false`;
    if (options.parentId) {
      query += ` and '${options.parentId}' in parents`;
    }
    if (options.modifiedAfter) {
      query += ` and modifiedTime > '${options.modifiedAfter}'`;
    }
    return listFiles({
      query,
      driveId: options.driveId,
      pageToken: options.pageToken,
    });
  };

  // Export Google Workspace file content
  const exportFileContent = async (fileId: string, mimeType: string): Promise<string> => {
    let exportMimeType = "text/plain";

    if (mimeType === GOOGLE_WORKSPACE_MIME_TYPES.SPREADSHEET) {
      exportMimeType = "text/csv"; // First sheet only
    } else if (mimeType === GOOGLE_WORKSPACE_MIME_TYPES.PRESENTATION) {
      exportMimeType = "text/plain";
    }

    try {
      const response = await call(() =>
        drive.files.export({fileId, mimeType: exportMimeType}, {responseType: "arraybuffer"}),
      );
      return Buffer.from(response.data as ArrayBuffer).toString("utf-8");
    } catch (error) {
      // Check if it's a "file too large" error (Google's 10MB export limit)
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isTooLarge = errorMessage.includes("too large") || errorMessage.includes("exportSizeLimitExceeded");

      if (isTooLarge) {
        console.warn(`File ${fileId} exceeds Google's 10MB export limit`);
        return "[Content unavailable: This file exceeds Google's 10MB export limit for Google Docs/Sheets/Slides]";
      }

      // Other export errors
      console.warn(`Failed to export content for file ${fileId}:`, error);
      return "[Content unavailable: Failed to export file content]";
    }
  };

  // Download binary file
  const downloadFile = async (fileId: string): Promise<Buffer> => {
    const response = await call(() =>
      drive.files.get({fileId, alt: "media", supportsAllDrives: true}, {responseType: "arraybuffer"}),
    );
    return Buffer.from(response.data as ArrayBuffer);
  };

  // Stream file to response
  const streamFile = async (
    out: Response,
    fileId: string,
    fileName: string,
    mimeType?: string,
    size?: string,
  ): Promise<void> => {
    const response = await call(() =>
      drive.files.get({fileId, alt: "media", supportsAllDrives: true}, {responseType: "stream"}),
    );

    out.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    if (mimeType) {
      out.setHeader("Content-Type", mimeType);
    }
    if (size) {
      out.setHeader("Content-Length", size);
    }

    return new Promise((resolve, reject) => {
      (response.data as NodeJS.ReadableStream).pipe(out).on("finish", resolve).on("error", reject);
    });
  };

  // Get file permissions (for user extraction)
  const getFilePermissions = async (fileId: string) => {
    const response = await call(() =>
      drive.permissions.list({
        fileId,
        supportsAllDrives: true,
        fields: "permissions(id, type, role, emailAddress, displayName, photoLink)",
      }),
    );
    return response.data.permissions || [];
  };

  // Get file metadata by ID
  const getFileMetadata = async (fileId: string): Promise<GoogleFileMetadata> => {
    const response = await call(() =>
      drive.files.get({
        fileId,
        supportsAllDrives: true,
        fields: "id, name, mimeType, size",
      }),
    );
    return response.data as GoogleFileMetadata;
  };

  // List permissions for a file or drive
  const listPermissions = async ({
    fileId,
    pageToken,
    pageSize = 100,
  }: {
    fileId: string;
    pageToken?: string;
    pageSize?: number;
  }): Promise<{permissions: GooglePermission[]; nextPageToken?: string}> => {
    const response = await call(() =>
      drive.permissions.list({
        fileId,
        pageToken,
        pageSize,
        supportsAllDrives: true,
        fields:
          "nextPageToken, permissions(id, type, role, emailAddress, displayName, photoLink, expirationTime, permissionDetails)",
      }),
    );
    return {
      permissions: (response.data.permissions || []) as GooglePermission[],
      nextPageToken: response.data.nextPageToken || undefined,
    };
  };

  return {
    validate,
    getCurrentUser,
    listSharedDrives,
    getMyDriveRoot,
    listFiles,
    listFolders,
    listNonFolderFiles,
    exportFileContent,
    downloadFile,
    streamFile,
    getFilePermissions,
    getFileMetadata,
    listPermissions,
  };
};

export type GoogleDriveApi = ReturnType<typeof createGoogleDriveApi>;
