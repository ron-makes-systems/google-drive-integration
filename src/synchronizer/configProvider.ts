import {config} from "../config.js";
import {SynchronizerConfig, SynchronizerFilter, SynchronizerType} from "../types/types.synchronizerConfig.js";

export const getSynchronizerConfig = (): SynchronizerConfig => {
  return {
    types: [
      {
        id: SynchronizerType.Drive,
        name: "Drive",
        default: true,
      },
      {
        id: SynchronizerType.Folder,
        name: "Folder",
        default: true,
      },
      {
        id: SynchronizerType.File,
        name: "File",
        default: true,
      },
      {
        id: SynchronizerType.User,
        name: "User",
        default: true,
        isUser: true,
      },
    ],
    filters: [
      {
        id: SynchronizerFilter.DriveIds,
        title: "Drives to Sync",
        datalist: true,
        optional: true,
        type: "multidropdown",
      },
    ],
    version: config.apiVersion,
  };
};
