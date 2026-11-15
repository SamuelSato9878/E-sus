import { createContext } from "react";
import type { User } from "../types/api";

export interface AuthValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
export const AuthContext = createContext<AuthValue | null>(null);
