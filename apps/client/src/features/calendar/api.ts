import { api } from "../../kernel/api";

export const useFeeds = () => api.useQuery("get", "/api/calendar/feeds");

export const useEvents = (pollInterval: number) =>
  api.useQuery("get", "/api/calendar/events", {}, { refetchInterval: pollInterval });

export const useAddFeed = () => api.useMutation("post", "/api/calendar/feeds");

export const useRemoveFeed = () => api.useMutation("delete", "/api/calendar/feeds/{id}");
