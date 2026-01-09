let driveCounter = 0;

export const resetDriveCounter = () => {
  driveCounter = 0;
};

export const driveBuilder = (
  overrides: Partial<{
    id: string;
    name: string;
    colorRgb: string;
    createdTime: string;
  }> = {},
) => {
  driveCounter++;
  return {
    id: overrides.id || `drive_${driveCounter}`,
    name: overrides.name || `Shared Drive ${driveCounter}`,
    colorRgb: overrides.colorRgb || "#4285f4",
    createdTime: overrides.createdTime || new Date().toISOString(),
  };
};
