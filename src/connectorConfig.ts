import {Action, ConnectorConfig} from "./types/types.connectorConfig.js";

// Helper to create share action args with resource-specific descriptions
const createShareActionArgs = (resourceType: "Drive" | "Folder" | "File"): Action["args"] => {
  // Files only support basic roles; Drives and Folders support additional roles
  const roleDescription =
    resourceType === "File"
      ? "Access level: Viewer, Commenter, or Editor"
      : "Access level: Viewer, Commenter, Editor, Content Manager, or Manager";

  return [
    {
      id: "resourceId",
      name: `${resourceType} ID`,
      description: `Google ID of the ${resourceType}`,
      type: "text",
      textTemplateSupported: true,
    },
    {
      id: "emails",
      name: "Email Addresses",
      description: "Comma-separated list of email addresses to share with",
      type: "text",
      textTemplateSupported: true,
    },
    {
      id: "role",
      name: "Role",
      description: roleDescription,
      type: "text",
      textTemplateSupported: true,
    },
    {
      id: "sendNotification",
      name: "Send Notification",
      description: "Send email notification: true or false (default: true)",
      type: "text",
      textTemplateSupported: true,
    },
  ];
};

export const getConnectorConfig = (): ConnectorConfig => {
  return {
    id: "google-drive-connector",
    name: "Google Drive",
    version: "1.0.0",
    type: "crunch",
    description: "Sync files, folders, and users from Google Drive to Fibery",
    authentication: [
      {
        id: "oauth2",
        name: "Google Account",
        description: "Connect with your Google account to access Drive files",
        type: "oauth2",
        provider: "google",
        fields: [
          {
            id: "oauth",
            title: "Google Account",
            description: "Click to connect your Google account",
            type: "oauth",
          },
        ],
      },
    ],
    sources: [],
    actions: [
      {
        action: "share-drive",
        name: "Share Drive",
        description: "Add members to a Shared Drive",
        args: createShareActionArgs("Drive"),
      },
      {
        action: "share-folder",
        name: "Share Folder",
        description: "Share a folder with users",
        args: createShareActionArgs("Folder"),
      },
      {
        action: "share-file",
        name: "Share File",
        description: "Share a file with users",
        args: createShareActionArgs("File"),
      },
    ],
    responsibleFor: {
      dataSynchronization: true,
      automations: true,
    },
  };
};
