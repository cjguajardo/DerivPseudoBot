export const getFormatedDate = timestamp => {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  const formatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });
  const dateString = formatter.format(date);
  return dateString;
};
