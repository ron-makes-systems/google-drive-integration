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
    thumbnailLink: {name: "Thumbnail URL", type: "text", subType: "url"},
    content: {name: "Content", type: "text", subType: "md"},
  },

  [SynchronizerType.User]: {
    id: {name: "Id", type: "id"},
    name: {name: "Name", type: "text", subType: "title"},
    email: {name: "Email", type: "text", subType: "email"},
    photoUrl: {name: "Photo", type: "text", subType: "avatar"},
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
