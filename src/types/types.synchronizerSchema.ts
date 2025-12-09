import {SynchronizerType} from "./types.synchronizerConfig.js";

export type SynchronizerSchemaField = {
  name: string;
  type: "id" | "text" | "date" | "number" | "array[text]";
  subType?:
    | "boolean"
    | "url"
    | "md"
    | "integer"
    | "html"
    | "multi-select"
    | "single-select"
    | "email"
    | "date-range"
    | "date-time-range"
    | "workflow"
    | "file"
    | "day"
    | "avatar"
    | "title"
    | "icon";
  options?: Array<{name: string; default?: boolean; final?: boolean; color?: string; type?: string}>;
  format?: {format?: string; currencyCode?: string; hasThousandSeparator?: boolean; precision?: number};
  order?: number;
  relation?: {
    cardinality: "many-to-one" | "many-to-many" | "one-to-one";
    name: string;
    targetName: string;
    targetType: SynchronizerType | "fibery/user";
    targetFieldId: string;
    kind?: "native";
  };
  postProcessingFunctions?: Array<{
    name: string;
    args?: Record<string, unknown>;
  }>;
};

export type SynchronizerSchema = {
  [key: string]: {
    id: SynchronizerSchemaField;
    name: SynchronizerSchemaField;
    [key: string]: SynchronizerSchemaField;
  };
};
