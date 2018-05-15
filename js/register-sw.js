/**
 * If browser is compatible with service workers, register new service worker
 */

if (navigator.serviceWorker) {
  navigator.serviceWorker.register('sw.js')
    .then(registration => {
      if (!navigator.serviceWorker.controller) return;
      console.log('service worker registered!');
    });
}
