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
    | "avatar";
  options?: Array<{name: string; default?: boolean; final?: boolean; color?: string}>;
  format?: {format?: string; currencyCode?: string; hasThousandSeparator?: boolean; precision?: number};
  order?: number;
  relation?: {
    cardinality: "many-to-one" | "many-to-many";
    name: string;
    targetName: string;
    targetType: SynchronizerType;
    targetFieldId: string;
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
