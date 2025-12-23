import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthStore {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    {
      name: "maybach-auth",
    }
  )
);

async function fetchUser(token: string | null): Promise<AuthUser | null> {
  if (!token) return null;
  
  const response = await fetch("/api/auth/user", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

async function loginRequest(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao fazer login");
  }

  return response.json();
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { token, user, setAuth, clearAuth } = useAuthStore();

  const { isLoading, refetch } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user", token],
    queryFn: () => fetchUser(token),
    retry: false,
    staleTime: 1000 * 60 * 5,
    enabled: !!token,
  });

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      queryClient.setQueryData(["/api/auth/user", data.token], data.user);
    },
  });

  const logout = () => {
    clearAuth();
    queryClient.clear();
  };

  return {
    user: token ? user : null,
    token,
    isLoading: !!token && isLoading,
    isAuthenticated: !!token && !!user,
    login: loginMutation.mutateAsync,
    loginError: loginMutation.error?.message,
    isLoggingIn: loginMutation.isPending,
    logout,
    refetch,
  };
}

export function getAuthToken(): string | null {
  return useAuthStore.getState().token;
}
