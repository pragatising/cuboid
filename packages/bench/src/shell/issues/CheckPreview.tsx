import { useSyncExternalStore } from "react";
import classes from "./IssuesPanel.module.css";
import { getChecking, setHost, subscribeChecking } from "./stage";

export function CheckPreview() {
  const name = useSyncExternalStore(subscribeChecking, getChecking);
  return (
    <div className={classes.Preview} hidden={name === null}>
      <span className={classes.PreviewLabel}>Checking {name}…</span>
      <div className={classes.PreviewStage} ref={setHost} />
    </div>
  );
}
