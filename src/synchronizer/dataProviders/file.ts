import _ from "lodash";
import {GetDataFn, PaginationConfig, SynchronizedFile} from "../../types/types.synchronizerData.js";
import {createGoogleDriveApi, GOOGLE_WORKSPACE_MIME_TYPES, EXPORTABLE_MIME_TYPES} from "../../api/googleDrive.js";
import {config} from "../../config.js";
import {GoogleFileMetadata} from "../../types/types.googleDrive.js";
import {AppError} from "../../errors/errors.js";

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

// Check if file is downloadable (not a Google Workspace file that requires export)
// Prefixed with _ since file download is disabled due to Fibery timeout, kept for future use
const _isDownloadable = (mimeType: string): boolean => {
  return !EXPORTABLE_MIME_TYPES.includes(mimeType as (typeof EXPORTABLE_MIME_TYPES)[number]);
};

// Generate embed HTML for Google Drive file preview
const generateEmbedHtml = (fileId: string): string => {
  const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
  return `<div contenteditable="false" data-dynamic-content="true" data-compatible-mode="true" data-url="${embedUrl}">Google Drive File</div>`;
};

const transform = (file: GoogleFileMetadata, content?: string, overrideDriveId?: string): SynchronizedFile => ({
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
  content: content || undefined,
  embed: generateEmbedHtml(file.id),
  // Only provide file download URL for binary files (not Google Workspace files)
  // File field disabled due to Fibery timeout issues with large files (>60s timeout)
  // file: _isDownloadable(file.mimeType) ? [`app://resource?type=file&fileId=${file.id}`] : undefined,
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
    if (content.length > 100000) {
      return content.substring(0, 100000) + "\n\n[Content truncated: Exceeded 100KB limit]";
    }
    return content;
  } catch {
    return "[Content unavailable: Unexpected error during content extraction]";
  }
};

// Build list of sources to query based on filter
const buildSourcesList = (driveIds: string[]): string[] => {
  if (driveIds.length === 0) {
    // No filter = query all sources (fallback)
    return ["all"];
  }

  const sources: string[] = [];
  // Add sources in order: root, shared_with_me, then shared drives
  if (driveIds.includes("root")) {
    sources.push("root");
  }
  if (driveIds.includes(SHARED_WITH_ME_DRIVE_ID)) {
    sources.push(SHARED_WITH_ME_DRIVE_ID);
  }
  // Add shared drive IDs
  for (const id of driveIds) {
    if (id !== "root" && id !== SHARED_WITH_ME_DRIVE_ID) {
      sources.push(id);
    }
  }
  return sources;
};

export const getFiles: GetDataFn<SynchronizedFile, PaginationConfig> = async ({
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

  // Build base query for non-folder files
  let baseQuery = `mimeType != '${GOOGLE_WORKSPACE_MIME_TYPES.FOLDER}' and trashed = false`;
  if (lastSynchronizedAt) {
    baseQuery += ` and modifiedTime > '${lastSynchronizedAt}'`;
  }

  const filesToProcess: Array<{file: GoogleFileMetadata; overrideDriveId?: string}> = [];
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
      filesToProcess.push({file: f, overrideDriveId: isSharedWithMe ? SHARED_WITH_ME_DRIVE_ID : undefined});
    }
    nextPageToken = result.nextPageToken;
  } else if (currentSource === "root") {
    // My Drive: query files owned by me
    const result = await api.listFiles({
      query: `${baseQuery} and 'me' in owners`,
      pageToken: pagination?.pageToken,
      pageSize: config.pageSize,
    });

    // Post-filter to exclude files in shared drives (they have driveId set)
    for (const f of result.files) {
      if (!f.driveId) {
        filesToProcess.push({file: f});
      }
    }
    nextPageToken = result.nextPageToken;
  } else if (currentSource === SHARED_WITH_ME_DRIVE_ID) {
    // Shared with me: query files shared with the user
    const result = await api.listFiles({
      query: `${baseQuery} and sharedWithMe = true`,
      pageToken: pagination?.pageToken,
      pageSize: config.pageSize,
    });

    filesToProcess.push(...result.files.map((f) => ({file: f, overrideDriveId: SHARED_WITH_ME_DRIVE_ID})));
    nextPageToken = result.nextPageToken;
  } else {
    // Specific shared drive: use efficient driveId filtering
    const result = await api.listFiles({
      query: baseQuery,
      driveId: currentSource,
      pageToken: pagination?.pageToken,
      pageSize: config.pageSize,
    });

    filesToProcess.push(...result.files.map((f) => ({file: f})));
    nextPageToken = result.nextPageToken;
  }

  // Calculate size for this page and add to cumulative total
  let cumulativeSizeBytes = pagination?.cumulativeSizeBytes || 0;
  for (const {file} of filesToProcess) {
    cumulativeSizeBytes += file.size ? parseInt(file.size, 10) : 0;
  }

  // Check quota limit
  if (cumulativeSizeBytes > config.storageQuotaBytes) {
    const totalGB = (cumulativeSizeBytes / 1024 ** 3).toFixed(2);
    const limitGB = (config.storageQuotaBytes / 1024 ** 3).toFixed(0);
    throw new AppError({
      statusCode: 400,
      message: `This sync contains ${totalGB} GB of files, which exceeds the ${limitGB} GB limit for your plan. Please select fewer drives or upgrade your plan.`,
      tryLater: false,
    });
  }

  // Extract content for Google Workspace files (in parallel with limit)
  const items = await Promise.all(
    filesToProcess.map(async ({file, overrideDriveId}) => {
      const content = await extractContent(api, file);
      return transform(file, content, overrideDriveId);
    }),
  );

  // Determine next pagination state
  let hasNext = false;
  const nextPageConfig: PaginationConfig = {sources, cumulativeSizeBytes};

  if (nextPageToken) {
    // More pages in current source
    hasNext = true;
    nextPageConfig.currentSourceIndex = currentSourceIndex;
    nextPageConfig.pageToken = nextPageToken;
  } else if (currentSourceIndex < sources.length - 1) {
    // Move to next source
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
