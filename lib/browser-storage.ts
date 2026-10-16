// Browser privacy settings may deny even reading window.sessionStorage.
// Keep the UI usable; callers surface that durable drafts are unavailable.
export function safeSessionStorage(): Storage {
  return {
    get length() {
      try {
        return window.sessionStorage.length;
      } catch {
        return 0;
      }
    },
    clear() {
      try {
        window.sessionStorage.clear();
      } catch {}
    },
    key(index) {
      try {
        return window.sessionStorage.key(index);
      } catch {
        return null;
      }
    },
    getItem(key) {
      try {
        return window.sessionStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem(key, value) {
      try {
        window.sessionStorage.setItem(key, value);
      } catch {}
    },
    removeItem(key) {
      try {
        window.sessionStorage.removeItem(key);
      } catch {}
    },
  };
}
