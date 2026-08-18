/**
 * Stringified and inlined as a blocking `<script>` in the document head, so
 * `data-theme` is set on `<html>` before the browser paints. Without this,
 * a visitor who chose "light" would see one dark frame (the CSS default)
 * before React/CSS media queries catch up — and worse, doing this in a
 * `useEffect` would set the attribute one paint late in every case, not
 * just on load, which is exactly the kind of client/server mismatch React
 * warns about since the server has no localStorage to read.
 */
export const THEME_STORAGE_KEY = "pryvex-theme";

export const themeInitScript = `(function () {
  try {
    var stored = localStorage.getItem("${THEME_STORAGE_KEY}");
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (e) {}
})();`;
