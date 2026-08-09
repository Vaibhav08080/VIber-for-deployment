/**
 * Supabase Integration Service
 * Helper utilities for testing user Supabase connections and handling credentials.
 */

export interface SupabaseConnectionResult {
  success: boolean;
  message: string;
}

/**
 * Validates Supabase URL format and tests connection against Supabase REST endpoint
 */
export async function testSupabaseConnection(
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<SupabaseConnectionResult> {
  try {
    const cleanUrl = supabaseUrl.trim().replace(/\/+$/, "");
    const cleanKey = supabaseAnonKey.trim();

    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      return { success: false, message: "Supabase URL must start with https://" };
    }

    if (!cleanKey || cleanKey.length < 20) {
      return { success: false, message: "Invalid Supabase Anon Key format" };
    }

    // Ping Supabase REST API root endpoint
    const res = await fetch(`${cleanUrl}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey: cleanKey,
        Authorization: `Bearer ${cleanKey}`,
      },
    });

    if (res.status === 200 || res.status === 404 || res.status === 401) {
      // Supabase REST endpoint responded
      if (res.status === 401) {
        return { success: false, message: "Authentication failed. Check your Supabase Anon Key." };
      }
      return { success: true, message: "Supabase connection verified successfully!" };
    }

    return {
      success: false,
      message: `Failed to connect to Supabase endpoint (${res.status})`,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Network error testing Supabase connection";
    return { success: false, message: errorMsg };
  }
}
