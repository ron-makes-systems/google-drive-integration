import _ from "lodash";
import {logger} from "../infra/logger.js";

export const parseVersion = (version?: string) => {
  if (_.isEmpty(version) || _.isUndefined(version)) {
    return 1;
  }

  try {
    return _.parseInt(version);
  } catch (e) {
    logger.error(`Could not parse version ${version}. Defaulting to 1.`);
    return 1;
  }
};
