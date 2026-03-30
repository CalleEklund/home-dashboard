import type { paths } from "@home-dashboard/api-schema";
import createFetchClient from "openapi-fetch";
import createQueryClient from "openapi-react-query";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export const fetchClient = createFetchClient<paths>({ baseUrl: API_BASE });
export const api = createQueryClient(fetchClient);
