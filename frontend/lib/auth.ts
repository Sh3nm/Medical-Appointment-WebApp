export type UserRole = "PATIENT" | "DOCTOR" | "ADMIN" | "";

const TOKEN_KEY = "medapp_token";
const ROLE_KEY = "medapp_role";

export const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const getStoredRole = (): UserRole => {
  if (typeof window === "undefined") return "";
  return (localStorage.getItem(ROLE_KEY) as UserRole) || "";
};

export const setAuth = (token: string, role: UserRole) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
};

export const clearAuth = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
};

export const getRedirectPathByRole = (role: UserRole) => {
  switch (role) {
    case "PATIENT":
      return "/patient/dashboard";
    case "DOCTOR":
      return "/doctor/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    default:
      return "/login";
  }
};

