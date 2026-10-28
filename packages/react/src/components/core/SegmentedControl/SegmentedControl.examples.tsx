import { useState } from "react";
import { SegmentedControl } from "@sragatiping/cuboid";

export function Default() {
  const [view, setView] = useState("states");

  return (
    <SegmentedControl aria-label="View" value={view} onValueChange={setView}>
      <SegmentedControl.Item value="states">States</SegmentedControl.Item>
      <SegmentedControl.Item value="anatomy">Anatomy</SegmentedControl.Item>
      <SegmentedControl.Item value="playground">Playground</SegmentedControl.Item>
    </SegmentedControl>
  );
}
