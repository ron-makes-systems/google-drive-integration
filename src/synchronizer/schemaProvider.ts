import {SynchronizerSchema} from "../types/types.synchronizerSchema.js";
import {SynchronizerType} from "../types/types.synchronizerConfig.js";
import {IntegrationAccount} from "../types/types.authentication.js";

const schema: SynchronizerSchema = {
  [SynchronizerType.Drive]: {
    id: {name: "Id", type: "id"},
    name: {name: "Name", type: "text", subType: "title"},
    type: {
      name: "Type",
      type: "text",
      subType: "single-select",
      options: [{name: "Personal"}, {name: "Shared"}, {name: "Shared With Me"}],
    },
    colorRgb: {name: "Color", type: "text"},
    createdTime: {name: "Created", type: "date"},
    webViewLink: {name: "URL", type: "text", subType: "url"},
  },

  [SynchronizerType.Folder]: {
    id: {name: "Id", type: "id"},
    name: {name: "Name", type: "text", subType: "title"},
    parentId: {
      name: "Parent Folder ID",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Parent Folder",
        targetName: "Subfolders",
        targetType: SynchronizerType.Folder,
        targetFieldId: "id",
      },
    },
    driveId: {
      name: "Drive ID",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Drive",
        targetName: "Folders",
        targetType: SynchronizerType.Drive,
        targetFieldId: "id",
      },
    },
    createdTime: {name: "Created", type: "date"},
    modifiedTime: {name: "Modified", type: "date"},
    webViewLink: {name: "URL", type: "text", subType: "url"},
  },

  [SynchronizerType.File]: {
    id: {name: "Id", type: "id"},
    name: {name: "Name", type: "text", subType: "title"},
    mimeType: {name: "MIME Type", type: "text"},
    mimeTypeCategory: {
      name: "File Type",
      type: "text",
      subType: "single-select",
      options: [
        {name: "Document"},
        {name: "Spreadsheet"},
        {name: "Presentation"},
        {name: "Image"},
        {name: "PDF"},
        {name: "Video"},
        {name: "Audio"},
        {name: "Archive"},
        {name: "Other"},
      ],
    },
    description: {name: "Description", type: "text", subType: "md"},
    size: {name: "Size (bytes)", type: "number", subType: "integer"},
    parentId: {
      name: "Folder ID",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Folder",
        targetName: "Files",
        targetType: SynchronizerType.Folder,
        targetFieldId: "id",
      },
    },
    driveId: {
      name: "Drive ID",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Drive",
        targetName: "Files",
        targetType: SynchronizerType.Drive,
        targetFieldId: "id",
      },
    },
    ownerId: {
      name: "Owner ID",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Owner",
        targetName: "Owned Files",
        targetType: SynchronizerType.User,
        targetFieldId: "id",
      },
    },
    lastModifyingUserId: {
      name: "Last Editor ID",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Last Editor",
        targetName: "Last Edited Files",
        targetType: SynchronizerType.User,
        targetFieldId: "id",
      },
    },
    createdTime: {name: "Created", type: "date"},
    modifiedTime: {name: "Modified", type: "date"},
    webViewLink: {name: "URL", type: "text", subType: "url"},
    iconLink: {name: "Icon URL", type: "text", subType: "url"},
    thumbnailLink: {name: "Thumbnail", type: "text", subType: "avatar"},
    content: {name: "Content", type: "text", subType: "md"},
    embed: {name: "Embed", type: "text", subType: "html"},
    // file field disabled due to Fibery timeout issues with large files (>60s timeout)
    // file: {name: "File", type: "array[text]", subType: "file"},
  },

  [SynchronizerType.User]: {
    id: {name: "Id", type: "id"},
    name: {name: "Name", type: "text", subType: "title"},
    email: {name: "Email", type: "text", subType: "email"},
    photoUrl: {name: "Photo", type: "text", subType: "avatar"},
  },

  [SynchronizerType.Role]: {
    id: {name: "Id", type: "id"},
    name: {name: "Name", type: "text", subType: "title"},
    description: {name: "Description", type: "text"},
    level: {name: "Level", type: "number", subType: "integer"},
    canEdit: {name: "Can Edit", type: "text", subType: "boolean"},
    canComment: {name: "Can Comment", type: "text", subType: "boolean"},
    canShare: {name: "Can Share", type: "text", subType: "boolean"},
  },

  [SynchronizerType.Permission]: {
    id: {name: "Id", type: "id"},
    name: {name: "Name", type: "text", subType: "title"},
    resourceId: {name: "Resource ID", type: "text"},
    resourceType: {
      name: "Resource Type",
      type: "text",
      subType: "single-select",
      options: [{name: "drive"}, {name: "folder"}, {name: "file"}],
    },
    driveId: {
      name: "Drive ID",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Drive",
        targetName: "Permissions",
        targetType: SynchronizerType.Drive,
        targetFieldId: "id",
      },
    },
    folderId: {
      name: "Folder ID",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Folder",
        targetName: "Permissions",
        targetType: SynchronizerType.Folder,
        targetFieldId: "id",
      },
    },
    fileId: {
      name: "File ID",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "File",
        targetName: "Permissions",
        targetType: SynchronizerType.File,
        targetFieldId: "id",
      },
    },
    userId: {
      name: "User ID",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "User",
        targetName: "Permissions",
        targetType: SynchronizerType.User,
        targetFieldId: "id",
      },
    },
    roleId: {
      name: "Role ID",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Role",
        targetName: "Permissions",
        targetType: SynchronizerType.Role,
        targetFieldId: "id",
      },
    },
    type: {
      name: "Type",
      type: "text",
      subType: "single-select",
      options: [{name: "user"}, {name: "group"}, {name: "domain"}, {name: "anyone"}],
    },
    email: {name: "Email", type: "text", subType: "email"},
    inherited: {name: "Inherited", type: "text", subType: "boolean"},
    permissionType: {
      name: "Permission Type",
      type: "text",
      subType: "single-select",
      options: [{name: "member"}, {name: "file"}],
    },
    inheritedFrom: {name: "Inherited From", type: "text"},
    expirationTime: {name: "Expires", type: "date"},
  },
};

export const getSchema = async (
  types: Array<SynchronizerType>,
  _account: IntegrationAccount,
): Promise<SynchronizerSchema> => {
  const result: SynchronizerSchema = {};

  for (const type of types) {
    if (schema[type]) {
      result[type] = schema[type];
    }
  }

  return result;
};
