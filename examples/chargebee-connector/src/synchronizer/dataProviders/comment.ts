import _ from "lodash";
import {GetDataFn, PaginationConfig, SynchronizedComment} from "../../types/types.synchronizerData.js";
import {config} from "../../config.js";
import {createChargebeeApi, Comment} from "../../api/chargebee.js";
import {minToSec, parseEntityIdForComment} from "../../utils/data.js";
import {commentEntities} from "../../types/types.synchronizerConfig.js";

const transform = (versionNumber: number, comment: Comment): Partial<SynchronizedComment> => {
  return {
    ...comment,
    name: comment.added_by || comment.type,
    notes: comment.notes,
    created_at: minToSec(comment.created_at),
    type: _.startCase(comment.type),
    [comment.entity_type]: parseEntityIdForComment(comment.entity_type, versionNumber, comment.entity_id),
  };
};

export const getComments: GetDataFn<SynchronizedComment, PaginationConfig> = async ({
  account,
  versionNumber,
  lastSynchronizedAtMin,
  pagination,
}) => {
  const chargebeeApi = createChargebeeApi(account);
  const commentResult = await chargebeeApi.getComments({
    limit: config.pageSize,
    offset: pagination?.offset,
    date_from: lastSynchronizedAtMin,
  });

  return {
    items: commentResult.list
      .filter((c) => commentEntities.includes(c.entity_type))
      .map((c) => transform(versionNumber, c)),
    synchronizationType: _.isEmpty(lastSynchronizedAtMin) ? "full" : "delta",
    pagination: {
      hasNext: !_.isEmpty(commentResult.next_offset),
      nextPageConfig: {offset: commentResult.next_offset},
    },
  };
};
