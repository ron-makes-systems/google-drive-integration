import _ from "lodash";
import {GetDataFn, SynchronizedPermission} from "../../types/types.synchronizerData.js";
import {createGoogleDriveApi, GOOGLE_WORKSPACE_MIME_TYPES} from "../../api/googleDrive.js";
import {config} from "../../config.js";
import {GooglePermission} from "../../types/types.googleDrive.js";

const SHARED_WITH_ME_DRIVE_ID = "shared_with_me";

// Resource types for permission syncing
type ResourceType = "drive" | "folder" | "file";

// Permission pagination config - tracks phase and progress
type PermissionPaginationConfig = {
  // Current phase: drives -> folders -> files
  phase: ResourceType;
  // Source tracking (for folders and files)
  sources?: string[];
  currentSourceIndex?: number;
  // Resource pagination
  resourcePageToken?: string;
  // Permission pagination within current resource
  pendingResourceIds?: string[];
  pendingResourceIndex?: number;
  permissionPageToken?: string;
  // For drives phase - list of shared drive IDs to fetch permissions for
  sharedDriveIds?: string[];
  sharedDriveIndex?: number;
};

// Transform Google permission to synchronized format
const transformPermission = (
  permission: GooglePermission,
  resourceId: string,
  resourceType: ResourceType,
): SynchronizedPermission => {
  // Compute inherited and permissionType from permissionDetails
  let inherited = false;
  let permissionType: string | undefined;
  let inheritedFrom: string | undefined;

  if (permission.permissionDetails && permission.permissionDetails.length > 0) {
    const detail = permission.permissionDetails[0];
    inherited = detail.inherited;
    permissionType = detail.permissionType;
    inheritedFrom = detail.inheritedFrom;
  }

  // Create unique ID combining resource and permission IDs
  const uniqueId = `${resourceType}_${resourceId}_${permission.id}`;

  // Build a descriptive name for the permission
  const name = permission.displayName || permission.emailAddress || permission.type;

  return {
    id: uniqueId,
    name,
    resourceId,
    resourceType,
    driveId: resourceType === "drive" ? resourceId : undefined,
    folderId: resourceType === "folder" ? resourceId : undefined,
    fileId: resourceType === "file" ? resourceId : undefined,
    userId: permission.type === "user" ? permission.id : undefined,
    roleId: permission.role,
    type: permission.type,
    email: permission.emailAddress,
    inherited: inherited ? "true" : "false",
    permissionType,
    inheritedFrom,
    expirationTime: permission.expirationTime,
  };
};

// Build list of sources to query based on filter
const buildSourcesList = (driveIds: string[]): string[] => {
  if (driveIds.length === 0) {
    return ["all"];
  }

  const sources: string[] = [];
  if (driveIds.includes("root")) {
    sources.push("root");
  }
  if (driveIds.includes(SHARED_WITH_ME_DRIVE_ID)) {
    sources.push(SHARED_WITH_ME_DRIVE_ID);
  }
  for (const id of driveIds) {
    if (id !== "root" && id !== SHARED_WITH_ME_DRIVE_ID) {
      sources.push(id);
    }
  }
  return sources;
};

// Get shared drive IDs from filter
const getSharedDriveIds = (driveIds: string[]): string[] => {
  return driveIds.filter((id) => id !== "root" && id !== SHARED_WITH_ME_DRIVE_ID);
};

export const getPermissions: GetDataFn<SynchronizedPermission, PermissionPaginationConfig> = async ({
  account,
  filter,
  lastSynchronizedAt,
  pagination,
}) => {
  const api = createGoogleDriveApi(account);
  const driveIds = filter?.driveIds || [];

  // Determine current phase (default to drives)
  const phase = pagination?.phase || "drive";

  // ============ PHASE 1: DRIVE PERMISSIONS ============
  if (phase === "drive") {
    // Get list of shared drives to fetch permissions for
    const sharedDriveIds = pagination?.sharedDriveIds || getSharedDriveIds(driveIds);
    const driveIndex = pagination?.sharedDriveIndex ?? 0;

    // If no shared drives, skip to folders phase
    if (sharedDriveIds.length === 0) {
      return getPermissions({
        account,
        filter,
        lastSynchronizedAt,
        pagination: {
          phase: "folder",
          sources: buildSourcesList(driveIds),
          currentSourceIndex: 0,
        },
      });
    }

    const currentDriveId = sharedDriveIds[driveIndex];

    // Fetch permissions for this drive
    const permResult = await api.listPermissions({
      fileId: currentDriveId,
      pageToken: pagination?.permissionPageToken,
    });

    const items = permResult.permissions.map((p) => transformPermission(p, currentDriveId, "drive"));

    // Determine next pagination state
    let hasNext = false;
    const nextPageConfig: PermissionPaginationConfig = {
      phase: "drive",
      sharedDriveIds,
    };

    if (permResult.nextPageToken) {
      // More permission pages for this drive
      hasNext = true;
      nextPageConfig.sharedDriveIndex = driveIndex;
      nextPageConfig.permissionPageToken = permResult.nextPageToken;
    } else if (driveIndex < sharedDriveIds.length - 1) {
      // Move to next drive
      hasNext = true;
      nextPageConfig.sharedDriveIndex = driveIndex + 1;
      nextPageConfig.permissionPageToken = undefined;
    } else {
      // Done with drives, move to folders phase
      hasNext = true;
      nextPageConfig.phase = "folder";
      nextPageConfig.sources = buildSourcesList(driveIds);
      nextPageConfig.currentSourceIndex = 0;
      nextPageConfig.sharedDriveIds = undefined;
      nextPageConfig.sharedDriveIndex = undefined;
    }

    return {
      items,
      synchronizationType: _.isEmpty(lastSynchronizedAt) ? "full" : "delta",
      pagination: {
        hasNext,
        nextPageConfig: hasNext ? nextPageConfig : undefined,
      },
    };
  }

  // ============ PHASE 2 & 3: FOLDER AND FILE PERMISSIONS ============
  const sources = pagination?.sources || buildSourcesList(driveIds);
  const currentSourceIndex = pagination?.currentSourceIndex ?? 0;
  const currentSource = sources[currentSourceIndex];
  const isFolder = phase === "folder";
  const mimeTypeCondition = isFolder
    ? `mimeType = '${GOOGLE_WORKSPACE_MIME_TYPES.FOLDER}'`
    : `mimeType != '${GOOGLE_WORKSPACE_MIME_TYPES.FOLDER}'`;

  // If we have pending resources to process for permissions
  if (pagination?.pendingResourceIds && pagination.pendingResourceIds.length > 0) {
    const pendingIndex = pagination.pendingResourceIndex ?? 0;
    const resourceId = pagination.pendingResourceIds[pendingIndex];

    // Fetch permissions for this resource
    const permResult = await api.listPermissions({
      fileId: resourceId,
      pageToken: pagination.permissionPageToken,
    });

    const items = permResult.permissions.map((p) => transformPermission(p, resourceId, phase));

    // Determine next pagination state
    let hasNext = false;
    const nextPageConfig: PermissionPaginationConfig = {
      phase,
      sources,
      currentSourceIndex,
      pendingResourceIds: pagination.pendingResourceIds,
    };

    if (permResult.nextPageToken) {
      // More permission pages for this resource
      hasNext = true;
      nextPageConfig.pendingResourceIndex = pendingIndex;
      nextPageConfig.permissionPageToken = permResult.nextPageToken;
    } else if (pendingIndex < pagination.pendingResourceIds.length - 1) {
      // Move to next pending resource
      hasNext = true;
      nextPageConfig.pendingResourceIndex = pendingIndex + 1;
      nextPageConfig.permissionPageToken = undefined;
    } else {
      // Done with pending resources
      if (pagination.resourcePageToken) {
        // More resource pages to fetch
        hasNext = true;
        nextPageConfig.resourcePageToken = pagination.resourcePageToken;
        nextPageConfig.pendingResourceIds = undefined;
        nextPageConfig.pendingResourceIndex = undefined;
      } else if (currentSourceIndex < sources.length - 1) {
        // Move to next source
        hasNext = true;
        nextPageConfig.currentSourceIndex = currentSourceIndex + 1;
        nextPageConfig.resourcePageToken = undefined;
        nextPageConfig.pendingResourceIds = undefined;
        nextPageConfig.pendingResourceIndex = undefined;
      } else if (isFolder) {
        // Done with folders, move to files phase
        hasNext = true;
        nextPageConfig.phase = "file";
        nextPageConfig.currentSourceIndex = 0;
        nextPageConfig.resourcePageToken = undefined;
        nextPageConfig.pendingResourceIds = undefined;
        nextPageConfig.pendingResourceIndex = undefined;
      }
    }

    return {
      items,
      synchronizationType: _.isEmpty(lastSynchronizedAt) ? "full" : "delta",
      pagination: {
        hasNext,
        nextPageConfig: hasNext ? nextPageConfig : undefined,
      },
    };
  }

  // Fetch resources (folders or files) and their permissions
  let baseQuery = `${mimeTypeCondition} and trashed = false`;
  if (lastSynchronizedAt) {
    baseQuery += ` and modifiedTime > '${lastSynchronizedAt}'`;
  }

  const resourcesToProcess: Array<{id: string; isSharedDrive: boolean; permissions?: GooglePermission[]}> = [];
  let nextResourcePageToken: string | undefined;

  // Query based on current source
  if (currentSource === "all") {
    const result = await api.listFiles({
      query: baseQuery,
      pageToken: pagination?.resourcePageToken,
      pageSize: config.pageSize,
      fields:
        "nextPageToken, files(id, driveId, permissions(id, type, role, emailAddress, displayName, photoLink, expirationTime, permissionDetails))",
    });

    for (const f of result.files) {
      resourcesToProcess.push({id: f.id, isSharedDrive: !!f.driveId, permissions: f.permissions});
    }
    nextResourcePageToken = result.nextPageToken;
  } else if (currentSource === "root") {
    const result = await api.listFiles({
      query: `${baseQuery} and 'me' in owners`,
      pageToken: pagination?.resourcePageToken,
      pageSize: config.pageSize,
      fields:
        "nextPageToken, files(id, driveId, permissions(id, type, role, emailAddress, displayName, photoLink, expirationTime, permissionDetails))",
    });

    for (const f of result.files) {
      if (!f.driveId) {
        resourcesToProcess.push({id: f.id, isSharedDrive: false, permissions: f.permissions});
      }
    }
    nextResourcePageToken = result.nextPageToken;
  } else if (currentSource === SHARED_WITH_ME_DRIVE_ID) {
    const result = await api.listFiles({
      query: `${baseQuery} and sharedWithMe = true`,
      pageToken: pagination?.resourcePageToken,
      pageSize: config.pageSize,
      fields:
        "nextPageToken, files(id, driveId, permissions(id, type, role, emailAddress, displayName, photoLink, expirationTime, permissionDetails))",
    });

    for (const f of result.files) {
      resourcesToProcess.push({id: f.id, isSharedDrive: !!f.driveId, permissions: f.permissions});
    }
    nextResourcePageToken = result.nextPageToken;
  } else {
    // Specific shared drive - permissions NOT included in response
    const result = await api.listFiles({
      query: baseQuery,
      driveId: currentSource,
      pageToken: pagination?.resourcePageToken,
      pageSize: config.pageSize,
      fields: "nextPageToken, files(id, driveId)",
    });

    for (const f of result.files) {
      resourcesToProcess.push({id: f.id, isSharedDrive: true});
    }
    nextResourcePageToken = result.nextPageToken;
  }

  // Process resources: My Drive has permissions in response, Shared Drive needs separate calls
  const items: SynchronizedPermission[] = [];
  const sharedDriveResourceIds: string[] = [];

  for (const resource of resourcesToProcess) {
    if (!resource.isSharedDrive && resource.permissions) {
      // My Drive: permissions are included in the response
      for (const perm of resource.permissions) {
        items.push(transformPermission(perm, resource.id, phase));
      }
    } else if (resource.isSharedDrive) {
      // Shared Drive: need to call permissions.list separately
      sharedDriveResourceIds.push(resource.id);
    }
  }

  // Determine next pagination state
  let hasNext = false;
  const nextPageConfig: PermissionPaginationConfig = {phase, sources, currentSourceIndex};

  if (sharedDriveResourceIds.length > 0) {
    // Need to fetch permissions for shared drive resources
    hasNext = true;
    nextPageConfig.pendingResourceIds = sharedDriveResourceIds;
    nextPageConfig.pendingResourceIndex = 0;
    nextPageConfig.resourcePageToken = nextResourcePageToken;
  } else if (nextResourcePageToken) {
    // More resource pages in current source
    hasNext = true;
    nextPageConfig.resourcePageToken = nextResourcePageToken;
  } else if (currentSourceIndex < sources.length - 1) {
    // Move to next source
    hasNext = true;
    nextPageConfig.currentSourceIndex = currentSourceIndex + 1;
    nextPageConfig.resourcePageToken = undefined;
  } else if (isFolder) {
    // Done with folders, move to files phase
    hasNext = true;
    nextPageConfig.phase = "file";
    nextPageConfig.currentSourceIndex = 0;
    nextPageConfig.resourcePageToken = undefined;
  }

  return {
    items,
    synchronizationType: _.isEmpty(lastSynchronizedAt) ? "full" : "delta",
    pagination: {
      hasNext,
      nextPageConfig: hasNext ? nextPageConfig : undefined,
    },
  };
};
