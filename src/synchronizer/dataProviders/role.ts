import {GetDataFn, SynchronizedRole} from "../../types/types.synchronizerData.js";

// Pre-populated role data matching Google Drive API role values
const ROLES: SynchronizedRole[] = [
  {
    id: "owner",
    name: "Owner",
    description: "Full ownership of the file. Can edit, comment, share, and delete.",
    level: 100,
    canEdit: "true",
    canComment: "true",
    canShare: "true",
  },
  {
    id: "organizer",
    name: "Manager",
    description: "Shared Drive manager. Can manage members, content, and settings.",
    level: 90,
    canEdit: "true",
    canComment: "true",
    canShare: "true",
  },
  {
    id: "fileOrganizer",
    name: "Content Manager",
    description: "Can add, edit, move, and delete content in a Shared Drive.",
    level: 80,
    canEdit: "true",
    canComment: "true",
    canShare: "false",
  },
  {
    id: "writer",
    name: "Editor",
    description: "Can edit the file and add comments.",
    level: 70,
    canEdit: "true",
    canComment: "true",
    canShare: "false",
  },
  {
    id: "commenter",
    name: "Commenter",
    description: "Can view and add comments but cannot edit.",
    level: 50,
    canEdit: "false",
    canComment: "true",
    canShare: "false",
  },
  {
    id: "reader",
    name: "Viewer",
    description: "Can view but cannot edit or comment.",
    level: 10,
    canEdit: "false",
    canComment: "false",
    canShare: "false",
  },
];

export const getRoles: GetDataFn<SynchronizedRole> = async () => {
  // Roles are static - always return all roles with no pagination
  return {
    items: ROLES,
    synchronizationType: "full",
    pagination: {
      hasNext: false,
    },
  };
};
