// Google API Response Types (simplified from googleapis)
export interface GoogleDriveMetadata {
  id: string;
  name: string;
  colorRgb?: string;
  createdTime?: string;
  capabilities?: Record<string, boolean>;
  restrictions?: Record<string, boolean>;
}

export interface GoogleFileMetadata {
  id: string;
  name: string;
  mimeType: string;
  description?: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  parents?: string[];
  driveId?: string;
  owners?: GoogleUser[];
  lastModifyingUser?: GoogleUser;
  trashed?: boolean;
  permissions?: GooglePermission[];
  ownedByMe?: boolean;
  shared?: boolean;
}

export interface GoogleUser {
  permissionId?: string;
  displayName?: string;
  emailAddress?: string;
  photoLink?: string;
  me?: boolean;
}

export interface GooglePermission {
  id: string;
  type: "user" | "group" | "domain" | "anyone";
  role: string;
  emailAddress?: string;
  displayName?: string;
  photoLink?: string;
}
