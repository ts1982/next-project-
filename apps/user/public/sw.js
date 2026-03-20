// @ts-check
/// <reference lib="webworker" />

/** @type {ServiceWorkerGlobalScope} */
const sw = self;

sw.addEventListener("push", (event) => {
  if (!event.data) return;

  /** @type {{ title: string; body: string; type?: string; url?: string }} */
  const data = event.data.json();

  const options = {
    body: data.body,
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    tag: data.tag || "notification-" + Date.now(),
    data: { url: data.url || "/notifications" },
  };

  event.waitUntil(sw.registration.showNotification(data.title, options));
});

sw.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/notifications";

  event.waitUntil(
    sw.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // 既存のウィンドウがあればフォーカス
        for (const client of clientList) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        // なければ新しいウィンドウを開く
        return sw.clients.openWindow(url);
      }),
  );
});
