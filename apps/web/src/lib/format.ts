const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export const formatDisplayDate = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const month = match ? months[Number(match[2]) - 1] : undefined;

  if (!match || !month) {
    return value;
  }

  return `${Number(match[3])} ${month} ${match[1]}`;
};
