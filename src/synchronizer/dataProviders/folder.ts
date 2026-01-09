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

export const getFolders: GetDataFn<SynchronizedFolder, PaginationConfig> = async ({
  account,
  filter,
  lastSynchronizedAt,
  pagination,
}) => {
  const api = createGoogleDriveApi(account);
  const driveIds = filter?.driveIds || [];

  // Check if "shared with me" is selected
  const includeSharedWithMe = driveIds.includes(SHARED_WITH_ME_DRIVE_ID);
  const otherDriveIds = driveIds.filter((id) => id !== SHARED_WITH_ME_DRIVE_ID);

  // Build base query for folders
  let baseQuery = `mimeType = '${GOOGLE_WORKSPACE_MIME_TYPES.FOLDER}' and trashed = false`;
  if (lastSynchronizedAt) {
    baseQuery += ` and modifiedTime > '${lastSynchronizedAt}'`;
  }

  const items: SynchronizedFolder[] = [];
  let nextPageToken: string | undefined;

  // If only "shared with me" is selected, query just that
  if (includeSharedWithMe && otherDriveIds.length === 0) {
    const query = `${baseQuery} and sharedWithMe = true`;
    const result = await api.listFiles({
      query,
      pageToken: pagination?.pageToken,
      pageSize: config.pageSize,
    });

    items.push(...result.files.map((f) => transform(f, SHARED_WITH_ME_DRIVE_ID)));
    nextPageToken = result.nextPageToken;
  } else {
    // Query all accessible folders
    const result = await api.listFiles({
      query: baseQuery,
      pageToken: pagination?.pageToken,
      pageSize: config.pageSize,
    });

    for (const f of result.files) {
      // Determine which drive this folder belongs to:
      // - If folder has a driveId, use that (it's in a shared drive)
      // - If ownedByMe is false and no driveId, it's shared with the user
      // - Otherwise it's in My Drive ("root")
      const isSharedWithMe = f.ownedByMe === false && !f.driveId;
      const folderDriveId = f.driveId || (isSharedWithMe ? SHARED_WITH_ME_DRIVE_ID : "root");

      // Skip if drive filter is active and this folder doesn't match
      if (driveIds.length > 0) {
        const matchesFilter = otherDriveIds.includes(folderDriveId) || (includeSharedWithMe && isSharedWithMe);
        if (!matchesFilter) {
          continue;
        }
      }

      items.push(transform(f, isSharedWithMe ? SHARED_WITH_ME_DRIVE_ID : undefined));
    }

    nextPageToken = result.nextPageToken;
  }

  return {
    items,
    synchronizationType: _.isEmpty(lastSynchronizedAt) ? "full" : "delta",
    pagination: {
      hasNext: !_.isEmpty(nextPageToken),
      nextPageConfig: {pageToken: nextPageToken},
    },
  };
};
