import { useState } from "react";
import { Switch } from "@sragatiping/cuboid";

export function Default() {
  const [notifications, setNotifications] = useState(false);

  return <Switch label="Notifications" checked={notifications} onCheckedChange={setNotifications} />;
}
