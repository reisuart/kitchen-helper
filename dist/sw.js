// Notifications only: no document/API caching, so private data stays out of caches.
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 event.waitUntil((async()=>{
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  const kitchen=windows.find(window=>window.url.startsWith(self.registration.scope));
  if(kitchen)return kitchen.focus();
  return self.clients.openWindow(self.registration.scope);
 })());
});
