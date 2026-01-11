import _ from "lodash";
import {GetDataFn, PaginationConfig, SynchronizedFolder} from "../../types/types.synchronizerData.js";
import {createGoogleDriveApi, GOOGLE_WORKSPACE_MIME_TYPES} from "../../api/googleDrive.js";
import {config} from "../../config.js";
import {GoogleFileMetadata} from "../../types/types.googleDrive.js";

const SHARED_WITH_ME_DRIVE_ID = "shared_with_me";

const transform = (folder: GoogleFileMetadata, overrideDriveId?: string): SynchronizedFolder => ({
  id: folder.id,
  name: folder.name,
  parentId: folder.parents?.[0],
  driveId: overrideDriveId || folder.driveId || "root",
  createdTime: folder.createdTime,
  modifiedTime: folder.modifiedTime,
  webViewLink: folder.webViewLink,
});

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

export const getFolders: GetDataFn<SynchronizedFolder, PaginationConfig> = async ({
  account,
  filter,
  lastSynchronizedAt,
  pagination,
}) => {
  const api = createGoogleDriveApi(account);
  const driveIds = filter?.driveIds || [];

  // Build or retrieve sources list for multi-source pagination
  const sources = pagination?.sources || buildSourcesList(driveIds);
  const currentSourceIndex = pagination?.currentSourceIndex ?? 0;
  const currentSource = sources[currentSourceIndex];

  // Build base query for folders
  let baseQuery = `mimeType = '${GOOGLE_WORKSPACE_MIME_TYPES.FOLDER}' and trashed = false`;
  if (lastSynchronizedAt) {
    baseQuery += ` and modifiedTime > '${lastSynchronizedAt}'`;
  }

  const items: SynchronizedFolder[] = [];
  let nextPageToken: string | undefined;

  // Query based on current source
  if (currentSource === "all") {
    // Fallback: no filter, query everything
    const result = await api.listFiles({
      query: baseQuery,
      pageToken: pagination?.pageToken,
      pageSize: config.pageSize,
    });

    for (const f of result.files) {
      const isSharedWithMe = f.ownedByMe === false && !f.driveId;
      items.push(transform(f, isSharedWithMe ? SHARED_WITH_ME_DRIVE_ID : undefined));
    }
    nextPageToken = result.nextPageToken;
  } else if (currentSource === "root") {
    // My Drive: query folders owned by me
    const result = await api.listFiles({
      query: `${baseQuery} and 'me' in owners`,
      pageToken: pagination?.pageToken,
      pageSize: config.pageSize,
    });

    // Post-filter to exclude folders in shared drives
    for (const f of result.files) {
      if (!f.driveId) {
        items.push(transform(f));
      }
    }
    nextPageToken = result.nextPageToken;
  } else if (currentSource === SHARED_WITH_ME_DRIVE_ID) {
    // Shared with me: query folders shared with the user
    const result = await api.listFiles({
      query: `${baseQuery} and sharedWithMe = true`,
      pageToken: pagination?.pageToken,
      pageSize: config.pageSize,
    });

    items.push(...result.files.map((f) => transform(f, SHARED_WITH_ME_DRIVE_ID)));
    nextPageToken = result.nextPageToken;
  } else {
    // Specific shared drive: use efficient driveId filtering
    const result = await api.listFiles({
      query: baseQuery,
      driveId: currentSource,
      pageToken: pagination?.pageToken,
      pageSize: config.pageSize,
    });

    items.push(...result.files.map((f) => transform(f)));
    nextPageToken = result.nextPageToken;
  }

  // Determine next pagination state
  let hasNext = false;
  const nextPageConfig: PaginationConfig = {sources};

  if (nextPageToken) {
    hasNext = true;
    nextPageConfig.currentSourceIndex = currentSourceIndex;
    nextPageConfig.pageToken = nextPageToken;
  } else if (currentSourceIndex < sources.length - 1) {
    hasNext = true;
    nextPageConfig.currentSourceIndex = currentSourceIndex + 1;
    nextPageConfig.pageToken = undefined;
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
