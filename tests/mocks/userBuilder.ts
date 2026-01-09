let userCounter = 0;

export const resetUserCounter = () => {
  userCounter = 0;
};

export const userBuilder = (
  overrides: Partial<{
    permissionId: string;
    displayName: string;
    emailAddress: string;
    photoLink: string;
    me: boolean;
  }> = {},
) => {
  userCounter++;
  return {
    permissionId: overrides.permissionId || `user_${userCounter}`,
    displayName: overrides.displayName || `User ${userCounter}`,
    emailAddress: overrides.emailAddress || `user${userCounter}@example.com`,
    photoLink: overrides.photoLink || `https://example.com/photo${userCounter}.jpg`,
    me: overrides.me ?? false,
  };
};
