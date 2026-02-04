import {GoogleFileMetadata} from "../types/types.googleDrive.js";
import {SynchronizedFile, SynchronizedFolder} from "../types/types.synchronizerData.js";
import {GOOGLE_WORKSPACE_MIME_TYPES} from "../api/googleDrive.js";

const getMimeTypeCategory = (mimeType: string): string => {
  if (mimeType === GOOGLE_WORKSPACE_MIME_TYPES.DOCUMENT) return "Document";
  if (mimeType === GOOGLE_WORKSPACE_MIME_TYPES.SPREADSHEET) return "Spreadsheet";
  if (mimeType === GOOGLE_WORKSPACE_MIME_TYPES.PRESENTATION) return "Presentation";
  if (mimeType.startsWith("image/")) return "Image";
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("video/")) return "Video";
  if (mimeType.startsWith("audio/")) return "Audio";
  if (mimeType.includes("zip") || mimeType.includes("tar") || mimeType.includes("compressed")) return "Archive";
  return "Other";
};

const generateEmbedHtml = (fileId: string): string => {
  const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
  return `<div contenteditable="false" data-dynamic-content="true" data-compatible-mode="true" data-url="${embedUrl}">Google Drive File</div>`;
};

export const toSynchronizedFile = (file: GoogleFileMetadata, overrideDriveId?: string): SynchronizedFile => ({
  id: file.id,
  googleId: file.id,
  name: file.name,
  mimeType: file.mimeType,
  mimeTypeCategory: getMimeTypeCategory(file.mimeType),
  description: file.description,
  size: file.size ? parseInt(file.size, 10) : undefined,
  parentId: file.parents?.[0],
  driveId: overrideDriveId || file.driveId || "root",
  ownerId: file.owners?.[0]?.permissionId,
  lastModifyingUserId: file.lastModifyingUser?.permissionId,
  createdTime: file.createdTime,
  modifiedTime: file.modifiedTime,
  webViewLink: file.webViewLink,
  iconLink: file.iconLink,
  thumbnailLink: file.thumbnailLink,
  embed: generateEmbedHtml(file.id),
});

export const toSynchronizedFolder = (folder: GoogleFileMetadata, overrideDriveId?: string): SynchronizedFolder => ({
  id: folder.id,
  googleId: folder.id,
  name: folder.name,
  parentId: folder.parents?.[0],
  driveId: overrideDriveId || folder.driveId || "root",
  createdTime: folder.createdTime,
  modifiedTime: folder.modifiedTime,
  webViewLink: folder.webViewLink,
});
