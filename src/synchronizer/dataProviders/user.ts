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

export const getUsers: GetDataFn<SynchronizedUser, PaginationConfig> = async ({
  account,
  filter,
  lastSynchronizedAt,
  pagination,
}) => {
  const api = createGoogleDriveApi(account);
  const collector = new UserCollector();
  const driveIds = filter?.driveIds || [];

  // Add current user first (only on first page)
  if (!pagination?.pageToken) {
    const currentUser = await api.getCurrentUser();
    collector.addUser(currentUser);
  }

  // Collect users from files
  let query = "trashed = false";
  if (lastSynchronizedAt) {
    query += ` and modifiedTime > '${lastSynchronizedAt}'`;
  }

  const result = await api.listFiles({
    query,
    pageToken: pagination?.pageToken,
    pageSize: config.pageSize,
    fields: "nextPageToken, files(id, owners, lastModifyingUser, driveId)",
  });

  // Filter by drive and collect users
  for (const file of result.files) {
    const fileDriveId = file.driveId || "root";
    if (driveIds.length > 0 && !driveIds.includes(fileDriveId) && !driveIds.includes("root")) {
      continue;
    }

    // Collect from owners
    if (file.owners) {
      for (const owner of file.owners) {
        collector.addUser(owner);
      }
    }

    // Collect from last modifying user
    if (file.lastModifyingUser) {
      collector.addUser(file.lastModifyingUser);
    }
  }

  return {
    items: collector.getAll(),
    synchronizationType: _.isEmpty(lastSynchronizedAt) ? "full" : "delta",
    pagination: {
      hasNext: !_.isEmpty(result.nextPageToken),
      nextPageConfig: {pageToken: result.nextPageToken},
    },
  };
};
