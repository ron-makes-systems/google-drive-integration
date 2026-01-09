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
};

// Synchronized entity types for Google Drive
export interface SynchronizedDrive {
  id: string;
  name: string;
  type: string; // "Personal" or "Shared"
  colorRgb?: string;
  createdTime?: string;
  webViewLink?: string;
}

export interface SynchronizedFolder {
  id: string;
  name: string;
  parentId?: string;
  driveId?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface SynchronizedFile {
  id: string;
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
}

export interface SynchronizedUser {
  id: string;
  name: string;
  email?: string;
  photoUrl?: string;
}
