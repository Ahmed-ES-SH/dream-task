import type { LoginRequest, LoginResponse } from "@/types/auth";
import type { User } from "@/types/user";

const MOCK_DELAY_MS = 600;

export const MOCK_CREDENTIALS = {
  email: "demo@example.com",
  password: "demo1234",
};

const MOCK_USER: User = {
  id: "usr_7f3c1a",
  fullName: "Demo User",
  email: MOCK_CREDENTIALS.email,
  role: "admin",
  status: "active",
  createdAt: "2025-03-12T10:24:00.000Z",
  lastLoginAt: new Date().toISOString(),
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockLogin(
  credentials: LoginRequest,
): Promise<LoginResponse> {
  await delay(MOCK_DELAY_MS);

  const emailMatches =
    credentials.email.trim().toLowerCase() === MOCK_CREDENTIALS.email;
  const passwordMatches = credentials.password === MOCK_CREDENTIALS.password;

  if (!emailMatches || !passwordMatches) {
    const error = new Error("Invalid email or password") as Error & {
      status?: number;
    };
    error.status = 401;
    throw error;
  }

  return {
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
    user: MOCK_USER,
  };
}

export async function mockProfile(): Promise<User> {
  await delay(500);
  return MOCK_USER;
}

export async function mockLogout(): Promise<void> {
  await delay(300);
}
