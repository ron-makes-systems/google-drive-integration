let fileCounter = 0;

export const resetFileCounter = () => {
  fileCounter = 0;
};

export const fileBuilder = (
  overrides: Partial<{
    id: string;
    name: string;
    mimeType: string;
    description: string;
    parents: string[];
    driveId: string;
    modifiedTime: string;
    createdTime: string;
    webViewLink: string;
    size: string;
    owners: Array<{permissionId: string; displayName: string; emailAddress: string}>;
    lastModifyingUser: {permissionId: string; displayName: string; emailAddress: string};
  }> = {},
) => {
  fileCounter++;
  return {
    id: overrides.id || `file_${fileCounter}`,
    name: overrides.name || `File ${fileCounter}.txt`,
    mimeType: overrides.mimeType || "text/plain",
    description: overrides.description,
    parents: overrides.parents || ["root"],
    driveId: overrides.driveId,
    modifiedTime: overrides.modifiedTime || new Date().toISOString(),
    createdTime: overrides.createdTime || new Date().toISOString(),
    webViewLink: overrides.webViewLink || `https://drive.google.com/file/d/file_${fileCounter}/view`,
    size: overrides.size || "1024",
    owners: overrides.owners || [
      {
        permissionId: `user_${fileCounter}`,
        displayName: `User ${fileCounter}`,
        emailAddress: `user${fileCounter}@example.com`,
      },
    ],
    lastModifyingUser: overrides.lastModifyingUser,
  };
};

export const googleDocBuilder = (overrides: Partial<Parameters<typeof fileBuilder>[0]> = {}) => {
  return fileBuilder({
    ...overrides,
    mimeType: "application/vnd.google-apps.document",
    name: overrides.name || `Document ${fileCounter + 1}`,
  });
};

export const folderBuilder = (overrides: Partial<Parameters<typeof fileBuilder>[0]> = {}) => {
  return fileBuilder({
    ...overrides,
    mimeType: "application/vnd.google-apps.folder",
    name: overrides.name || `Folder ${fileCounter + 1}`,
  });
};
