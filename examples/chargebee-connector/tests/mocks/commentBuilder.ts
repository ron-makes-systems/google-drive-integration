import {Comment} from "chargebee";

let commentCounter = 0;

export const commentBuilder = (overrides: Partial<Comment> = {}): Comment => {
  commentCounter++;
  const id = overrides.id || `comment_${commentCounter}`;
  const now = Math.floor(Date.now() / 1000);

  return {
    id,
    entity_type: "subscription",
    entity_id: `sub_${commentCounter}`,
    notes: `This is comment ${commentCounter}`,
    type: "user",
    created_at: now - 86400,
    added_by: `admin_${commentCounter}`,
    ...overrides,
  } as Comment;
};

export const resetCommentCounter = () => {
  commentCounter = 0;
};
