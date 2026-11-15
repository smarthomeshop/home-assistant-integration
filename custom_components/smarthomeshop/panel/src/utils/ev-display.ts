export const translateEVReason = (
  source: string,
  translate: (value: string) => string,
): string => {
  const full = translate(source);
  if (full !== source) return full;
  const separator = source.indexOf(': ');
  if (separator >= 0) {
    const prefix = source.slice(0, separator + 2);
    const reason = source.slice(separator + 2);
    const translatedReason = translate(reason);
    if (translatedReason !== reason) return `${prefix}${translatedReason}`;
  }
  return source.split(', ').map(part => translate(part)).join(', ');
};
