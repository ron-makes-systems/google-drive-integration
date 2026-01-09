import _ from "lodash";
import {GetDataFn, PaginationConfig, SynchronizedFile} from "../../types/types.synchronizerData.js";
import {createGoogleDriveApi, GOOGLE_WORKSPACE_MIME_TYPES, EXPORTABLE_MIME_TYPES} from "../../api/googleDrive.js";
import {config} from "../../config.js";
import {GoogleFileMetadata} from "../../types/types.googleDrive.js";

const SHARED_WITH_ME_DRIVE_ID = "shared_with_me";

// Map MIME types to categories
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

const transform = (file: GoogleFileMetadata, content?: string, overrideDriveId?: string): SynchronizedFile => ({
  id: file.id,
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
  content: content || undefined,
});

// Content extraction with size limit (10MB for Google Workspace files)
const extractContent = async (
  api: ReturnType<typeof createGoogleDriveApi>,
  file: GoogleFileMetadata,
): Promise<string> => {
  if (!EXPORTABLE_MIME_TYPES.includes(file.mimeType as (typeof EXPORTABLE_MIME_TYPES)[number])) {
    return "";
  }

  try {
    const content = await api.exportFileContent(file.id, file.mimeType);
    // Truncate extremely large content (>100KB) to avoid memory issues
    return content.length > 100000 ? content.substring(0, 100000) + "... [truncated]" : content;
  } catch {
    return "";
  }
};

export const getFiles: GetDataFn<SynchronizedFile, PaginationConfig> = async ({
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

  // Build base query for non-folder files
  let baseQuery = `mimeType != '${GOOGLE_WORKSPACE_MIME_TYPES.FOLDER}' and trashed = false`;
  if (lastSynchronizedAt) {
    baseQuery += ` and modifiedTime > '${lastSynchronizedAt}'`;
  }

  const filesToProcess: Array<{file: GoogleFileMetadata; overrideDriveId?: string}> = [];
  let nextPageToken: string | undefined;

  // If only "shared with me" is selected, query just that
  if (includeSharedWithMe && otherDriveIds.length === 0) {
    const query = `${baseQuery} and sharedWithMe = true`;
    const result = await api.listFiles({
      query,
      pageToken: pagination?.pageToken,
      pageSize: config.pageSize,
    });

    filesToProcess.push(...result.files.map((f) => ({file: f, overrideDriveId: SHARED_WITH_ME_DRIVE_ID})));
    nextPageToken = result.nextPageToken;
  } else {
    // Query all accessible files
    const result = await api.listFiles({
      query: baseQuery,
      pageToken: pagination?.pageToken,
      pageSize: config.pageSize,
    });

    for (const f of result.files) {
      // Determine which drive this file belongs to:
      // - If file has a driveId, use that (it's in a shared drive)
      // - If ownedByMe is false and no driveId, it's shared with the user
      // - Otherwise it's in My Drive ("root")
      const isSharedWithMe = f.ownedByMe === false && !f.driveId;
      const fileDriveId = f.driveId || (isSharedWithMe ? SHARED_WITH_ME_DRIVE_ID : "root");

      // Skip if drive filter is active and this file doesn't match
      if (driveIds.length > 0) {
        const matchesFilter = otherDriveIds.includes(fileDriveId) || (includeSharedWithMe && isSharedWithMe);
        if (!matchesFilter) {
          continue;
        }
      }

      filesToProcess.push({file: f, overrideDriveId: isSharedWithMe ? SHARED_WITH_ME_DRIVE_ID : undefined});
    }

    nextPageToken = result.nextPageToken;
  }

  // Extract content for Google Workspace files (in parallel with limit)
  const items = await Promise.all(
    filesToProcess.map(async ({file, overrideDriveId}) => {
      const content = await extractContent(api, file);
      return transform(file, content, overrideDriveId);
    }),
  );

  return {
    items,
    synchronizationType: _.isEmpty(lastSynchronizedAt) ? "full" : "delta",
    pagination: {
      hasNext: !_.isEmpty(nextPageToken),
      nextPageConfig: {pageToken: nextPageToken},
    },
  };
};
