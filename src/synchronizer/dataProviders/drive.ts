import _ from "lodash";
import {GetDataFn, PaginationConfig, SynchronizedDrive} from "../../types/types.synchronizerData.js";
import {createGoogleDriveApi} from "../../api/googleDrive.js";
import {config} from "../../config.js";

const getDriveTypeLabel = (type: "personal" | "shared" | "shared_with_me"): string => {
  switch (type) {
    case "personal":
      return "Personal";
    case "shared_with_me":
      return "Shared With Me";
    case "shared":
      return "Shared";
  }
};

const getDriveWebLink = (id: string, type: "personal" | "shared" | "shared_with_me"): string => {
  switch (type) {
    case "personal":
      return "https://drive.google.com/drive/my-drive";
    case "shared_with_me":
      return "https://drive.google.com/drive/shared-with-me";
    case "shared":
      return `https://drive.google.com/drive/folders/${id}`;
  }
};

const transform = (drive: {
  id: string;
  name: string;
  type: "personal" | "shared" | "shared_with_me";
  colorRgb?: string;
  createdTime?: string;
}): SynchronizedDrive => ({
  id: drive.id,
  name: drive.name,
  type: getDriveTypeLabel(drive.type),
  colorRgb: drive.colorRgb,
  createdTime: drive.createdTime,
  webViewLink: getDriveWebLink(drive.id, drive.type),
});

export const getDrives: GetDataFn<SynchronizedDrive, PaginationConfig> = async ({account, filter, pagination}) => {
  const api = createGoogleDriveApi(account);
  const items: SynchronizedDrive[] = [];

  // On first page, include My Drive and Shared with me
  if (!pagination?.pageToken) {
    // My Drive - use "root" as ID since files in My Drive have driveId: undefined,
    // and we normalize undefined to "root" in file/folder providers
    items.push(
      transform({
        id: "root",
        name: "My Drive",
        type: "personal",
      }),
    );

    // Shared with me - virtual drive for files others have shared with the user
    items.push(
      transform({
        id: "shared_with_me",
        name: "Shared with me",
        type: "shared_with_me",
      }),
    );
  }

  // Get shared drives
  const result = await api.listSharedDrives({
    pageSize: config.pageSize,
    pageToken: pagination?.pageToken,
  });

  for (const drive of result.drives) {
    items.push(
      transform({
        id: drive.id,
        name: drive.name,
        type: "shared",
        colorRgb: drive.colorRgb,
        createdTime: drive.createdTime,
      }),
    );
  }

  // Filter drives based on selected driveIds
  const driveIds = filter?.driveIds || [];
  const filteredItems = driveIds.length > 0 ? items.filter((item) => driveIds.includes(item.id)) : items;

  return {
    items: filteredItems,
    synchronizationType: "full", // Drives don't have modifiedTime for delta sync
    pagination: {
      hasNext: !_.isEmpty(result.nextPageToken),
      nextPageConfig: {pageToken: result.nextPageToken},
    },
  };
};
