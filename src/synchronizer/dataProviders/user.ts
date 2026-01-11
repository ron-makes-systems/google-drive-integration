import _ from "lodash";
import {GetDataFn, PaginationConfig, SynchronizedUser} from "../../types/types.synchronizerData.js";
import {createGoogleDriveApi} from "../../api/googleDrive.js";
import {config} from "../../config.js";
import {GoogleUser} from "../../types/types.googleDrive.js";

// User collector to deduplicate users across files
class UserCollector {
  private users = new Map<string, SynchronizedUser>();

  addUser(user: GoogleUser | undefined) {
    if (!user?.permissionId) return;

    if (!this.users.has(user.permissionId)) {
      this.users.set(user.permissionId, {
        id: user.permissionId,
        name: user.displayName || user.emailAddress || "Unknown",
        email: user.emailAddress || undefined,
        photoUrl: user.photoLink || undefined,
      });
    }
  }

  getAll(): SynchronizedUser[] {
    return Array.from(this.users.values());
  }
}

const SHARED_WITH_ME_DRIVE_ID = "shared_with_me";

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

export const getUsers: GetDataFn<SynchronizedUser, PaginationConfig> = async ({
  account,
  filter,
  lastSynchronizedAt,
  pagination,
}) => {
  const api = createGoogleDriveApi(account);
  const collector = new UserCollector();
  const driveIds = filter?.driveIds || [];

  // Build or retrieve sources list for multi-source pagination
  const sources = pagination?.sources || buildSourcesList(driveIds);
  const currentSourceIndex = pagination?.currentSourceIndex ?? 0;
  const currentSource = sources[currentSourceIndex];

  // Add current user first (only on very first page of first source)
  if (!pagination?.pageToken && currentSourceIndex === 0) {
    const currentUser = await api.getCurrentUser();
    collector.addUser(currentUser);
  }

  // Collect users from files
  let baseQuery = "trashed = false";
  if (lastSynchronizedAt) {
    baseQuery += ` and modifiedTime > '${lastSynchronizedAt}'`;
  }

  const fields = "nextPageToken, files(id, owners, lastModifyingUser, driveId, ownedByMe)";
  let result;
  let nextPageToken: string | undefined;

  // Query based on current source
  if (currentSource === "all") {
    // Fallback: no filter, query everything
    result = await api.listFiles({
      query: baseQuery,
      pageToken: pagination?.pageToken,
      pageSize: config.pageSize,
      fields,
    });

    for (const file of result.files) {
      if (file.owners) {
        for (const owner of file.owners) {
          collector.addUser(owner);
        }
      }
      if (file.lastModifyingUser) {
        collector.addUser(file.lastModifyingUser);
      }
    }
    nextPageToken = result.nextPageToken;
  } else if (currentSource === "root") {
    // My Drive: query files owned by me
    result = await api.listFiles({
      query: `${baseQuery} and 'me' in owners`,
      pageToken: pagination?.pageToken,
      pageSize: config.pageSize,
      fields,
    });

    // Post-filter to exclude files in shared drives
    for (const file of result.files) {
      if (!file.driveId) {
        if (file.owners) {
          for (const owner of file.owners) {
            collector.addUser(owner);
          }
        }
        if (file.lastModifyingUser) {
          collector.addUser(file.lastModifyingUser);
        }
      }
    }
    nextPageToken = result.nextPageToken;
  } else if (currentSource === SHARED_WITH_ME_DRIVE_ID) {
    // Shared with me: query files shared with the user
    result = await api.listFiles({
      query: `${baseQuery} and sharedWithMe = true`,
      pageToken: pagination?.pageToken,
      pageSize: config.pageSize,
      fields,
    });

    for (const file of result.files) {
      if (file.owners) {
        for (const owner of file.owners) {
          collector.addUser(owner);
        }
      }
      if (file.lastModifyingUser) {
        collector.addUser(file.lastModifyingUser);
      }
    }
    nextPageToken = result.nextPageToken;
  } else {
    // Specific shared drive: use efficient driveId filtering
    result = await api.listFiles({
      query: baseQuery,
      driveId: currentSource,
      pageToken: pagination?.pageToken,
      pageSize: config.pageSize,
      fields,
    });

    for (const file of result.files) {
      if (file.owners) {
        for (const owner of file.owners) {
          collector.addUser(owner);
        }
      }
      if (file.lastModifyingUser) {
        collector.addUser(file.lastModifyingUser);
      }
    }
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
    items: collector.getAll(),
    synchronizationType: _.isEmpty(lastSynchronizedAt) ? "full" : "delta",
    pagination: {
      hasNext,
      nextPageConfig: hasNext ? nextPageConfig : undefined,
    },
  };
};
