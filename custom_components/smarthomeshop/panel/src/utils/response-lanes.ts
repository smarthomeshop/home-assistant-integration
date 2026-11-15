export const responseIsCurrent = (
  request: number,
  currentRequest: number,
  configGeneration: number,
  currentConfigGeneration: number,
): boolean => request === currentRequest && configGeneration === currentConfigGeneration;
