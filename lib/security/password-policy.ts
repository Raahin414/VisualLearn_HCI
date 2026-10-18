// Researcher password rule, mirrored by the Supabase project setting
// (minimum 12, lower + upper letters + digits). Checked in browser and server.
export const PASSWORD_HINT =
  "At least 12 characters with lowercase and uppercase letters and a digit.";
export function passwordProblem(password: string) {
  if (password.length < 12) return "Use at least 12 characters.";
  if (password.length > 128) return "Use at most 128 characters.";
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password))
    return "Include lowercase and uppercase letters and a digit.";
  return null;
}
