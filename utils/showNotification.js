function showNotification(title, body) {
  if (!("Notification" in window)) {
    console.error("This browser does not support desktop notification");
  } else if (Notification.permission === "granted") {
    try {
      new Notification(title, { body });
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(function (permission) {
      if (permission === "granted") {
        try {
          new Notification(title, { body });
        } catch (error) {
          console.error("Error showing notification:", error);
        }
      }
    });
  }
}
