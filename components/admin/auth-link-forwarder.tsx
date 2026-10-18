"use client";
import { useEffect } from "react";
// Supabase sends invitation/recovery links to the project's Site URL when no
// specific redirect was given. Forward their fragment to the accept page.
export function AuthLinkForwarder() {
  useEffect(() => {
    const hash = window.location.hash;
    if (
      window.location.pathname !== "/admin/accept" &&
      /(^#|&)(access_token|error_code)=/.test(hash) &&
      /(^#|&)(type=(invite|recovery)|error_code=)/.test(hash)
    )
      window.location.replace(`/admin/accept${hash}`);
  }, []);
  return null;
}
