import {createGoogleDriveApi} from "../api/googleDrive.js";
import {ValidationError} from "../errors/errors.js";
import {IntegrationAccount} from "../types/types.authentication.js";
import {logger} from "../infra/logger.js";

const SHARE_ACTIONS = ["share-drive", "share-folder", "share-file"];

export type ActionArgs = {
  resourceId: string;
  emails: string;
  role: string;
  sendNotification?: string;
};

export const executeAction = async (account: IntegrationAccount, action: string, args: ActionArgs): Promise<void> => {
  if (SHARE_ACTIONS.includes(action)) {
    await executeShareAction(account, args);
  } else {
    throw new ValidationError(`Unknown action: ${action}`);
  }
};

const executeShareAction = async (account: IntegrationAccount, args: ActionArgs): Promise<void> => {
  const {resourceId, emails, role, sendNotification} = args;

  if (!resourceId) {
    throw new ValidationError(`"resourceId" is required`);
  }
  if (!emails) {
    throw new ValidationError(`"emails" is required`);
  }
  if (!role) {
    throw new ValidationError(`"role" is required`);
  }

  // Parse comma-separated emails
  const emailList = emails
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (emailList.length === 0) {
    throw new ValidationError(`No valid email addresses provided`);
  }

  // Map user-friendly role names to API values
  const roleMapping: Record<string, string> = {
    viewer: "reader",
    commenter: "commenter",
    editor: "writer",
    "content manager": "fileOrganizer",
    manager: "organizer",
    // Also accept API values directly
    reader: "reader",
    writer: "writer",
    fileorganizer: "fileOrganizer",
    organizer: "organizer",
  };

  const normalizedRole = role.toLowerCase();
  const apiRole = roleMapping[normalizedRole];

  if (!apiRole) {
    throw new ValidationError(
      `Invalid role "${role}". Valid roles: Viewer, Commenter, Editor, Content Manager, Manager`,
    );
  }

  const notify = sendNotification !== "false";
  const api = createGoogleDriveApi(account);

  logger.info(`Sharing resource ${resourceId} with ${emailList.length} users as ${apiRole}`);

  // Create permission for each email
  for (const email of emailList) {
    try {
      await api.createPermission({
        fileId: resourceId,
        type: "user",
        role: apiRole,
        emailAddress: email,
        sendNotificationEmail: notify,
      });
      logger.info(`Shared ${resourceId} with ${email} as ${apiRole}`);
    } catch (error) {
      logger.error(`Failed to share ${resourceId} with ${email}:`, {error});
      throw error;
    }
  }
};
