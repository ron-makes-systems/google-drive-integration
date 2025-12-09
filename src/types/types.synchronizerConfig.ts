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
  // your-connector: populate sync types here
}

export enum SynchronizerFilter {
  // your-connector: populate sync filters here
}
