type SynchronizerTypeMeta = {
  id: SynchronizerType;
  name: string;
  default: boolean;
  isUser?: boolean;
};

type SynchronizerFilterMeta = {
  id: SynchronizerFilter;
  title: string;
  datalist?: boolean;
  secured?: boolean;
  optional: boolean;
  type: "bool" | "list" | "multidropdown" | "datebox" | "text" | "number";
  datalist_requires?: Array<SynchronizerFilter>;
  defaultValue?: unknown;
};

export type SynchronizerConfig = {
  types: Array<SynchronizerTypeMeta>;
  filters: Array<SynchronizerFilterMeta>;
  version: number;
};

export enum SynchronizerType {
  Drive = "drive",
  Folder = "folder",
  File = "file",
  User = "user",
}

export enum SynchronizerFilter {
  DriveIds = "driveIds",
}
