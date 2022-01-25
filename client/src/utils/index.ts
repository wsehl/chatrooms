import { useTimeAgo } from "@vueuse/core";

export const getRandomItem = (array: Array<any>): any => {
  return array[Math.floor(Math.random() * array.length)];
};

export const formatDate = (date: Date | string) => {
  const timeAgo = useTimeAgo(date);
  return timeAgo.value;
};
