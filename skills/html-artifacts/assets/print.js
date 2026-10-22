/* Preserve disclosure content in print, then restore the reader's screen state. */
(() => {
  let closed = [];
  let printing = false;
  window.addEventListener('beforeprint', () => {
    if (printing) return;
    printing = true;
    closed = [...document.querySelectorAll('details:not([open])')];
    closed.forEach(detail => { detail.open = true; });
  });
  window.addEventListener('afterprint', () => {
    closed.forEach(detail => { detail.open = false; });
    closed = [];
    printing = false;
  });
})();
