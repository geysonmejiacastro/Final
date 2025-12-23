import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

export type Item = {
  id: number;
  name: string;
  category: string;
  status: "active" | "repair" | "retired";
  notes: string | null;
  created_at: string;
};
