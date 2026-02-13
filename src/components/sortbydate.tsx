interface ContentEntry {
  data?: {
    pubDate?: Date | string;
  };
}

export const sortByDate = (a: ContentEntry, b: ContentEntry): number => {
  return (
    new Date(b?.data?.pubDate ?? 0).getTime() -
    new Date(a?.data?.pubDate ?? 0).getTime()
  );
};
