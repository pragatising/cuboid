import { useState } from "react";
import { Select } from "@sragatiping/cuboid";

const FRUIT = ["Apple", "Banana", "Cherry", "Grape", "Lemon", "Mango"];

export function Default() {
  const [fruit, setFruit] = useState("");

  return (
    <Select label="Fruit" placeholder="Choose one" value={fruit} onValueChange={setFruit}>
      {FRUIT.map((name) => (
        <Select.Option key={name} value={name.toLowerCase()}>
          {name}
        </Select.Option>
      ))}
    </Select>
  );
}
