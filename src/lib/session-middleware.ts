import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

export const SESSION_ID_COOKIE = "search-arena-session-id";

/**
 * Gets the current session ID from cookies or creates a new one
 */
export async function getOrCreateSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_ID_COOKIE);

  if (sessionCookie?.value) return sessionCookie.value;

  const sessionId = uuidv4();

  cookieStore.set(SESSION_ID_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
  });

  return sessionId;
}
