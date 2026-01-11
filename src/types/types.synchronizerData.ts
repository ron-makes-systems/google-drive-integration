import {IntegrationAccount} from "./types.authentication.js";
import {SynchronizerDataFilter} from "./types.requests.js";

export type SynchronizationDataType = "delta" | "full";

export type SynchronizerPagination<P> = {
  hasNext: boolean;
  nextPageConfig?: P;
};

export type SynchronizerData<T, P = unknown> = {
  items: Array<Partial<T>>;
  synchronizationType?: SynchronizationDataType;
  pagination?: SynchronizerPagination<P>;
};

export type GetDataFn<T, P = unknown> = (p: {
  account: IntegrationAccount;
  filter?: Partial<SynchronizerDataFilter>;
  lastSynchronizedAt?: string;
  pagination?: P;
}) => Promise<SynchronizerData<T, P>>;

export type PaginationConfig = {
  pageToken?: string;
  cumulativeSizeBytes?: number; // Track size across pages for quota enforcement
  // Multi-source pagination: process sources sequentially
  currentSourceIndex?: number; // Index into the sources array
  sources?: string[]; // Ordered list of sources: ["root", "shared_with_me", "driveId1", ...]
};

// Synchronized entity types for Google Drive
export interface SynchronizedDrive {
  id: string;
  googleId: string;
  name: string;
  type: string; // "Personal" or "Shared"
  colorRgb?: string;
  createdTime?: string;
  webViewLink?: string;
}

export interface SynchronizedFolder {
  id: string;
  googleId: string;
  name: string;
  parentId?: string;
  driveId?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface SynchronizedFile {
  id: string;
  googleId: string;
  name: string;
  mimeType: string;
  mimeTypeCategory?: string;
  description?: string;
  size?: number;
  parentId?: string;
  driveId?: string;
  ownerId?: string;
  lastModifyingUserId?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  content?: string;
  embed?: string;
  file?: string[];
}

export interface SynchronizedUser {
  id: string;
  name: string;
  email?: string;
  photoUrl?: string;
}

export interface SynchronizedRole {
  id: string;
  name: string;
  description: string;
  level: number;
  canEdit: string; // "true" or "false" - Fibery boolean as text
  canComment: string;
  canShare: string;
}

export interface SynchronizedPermission {
  id: string;
  name: string;
  resourceId: string;
  resourceType: "drive" | "folder" | "file";
  driveId?: string;
  folderId?: string;
  fileId?: string;
  userId?: string;
  roleId: string;
  type: string; // "user" | "group" | "domain" | "anyone"
  email?: string;
  inherited: string; // "true" or "false" - Fibery boolean as text
  permissionType?: string; // "member" or "file"
  inheritedFrom?: string;
  expirationTime?: string;
}
