import { useState } from "react";
import { ActionMenu, Pill, Table, useTableColumns } from "@sragatiping/cuboid";
import type { TableColumn } from "@sragatiping/cuboid";

const components = [
  { name: "Button", owner: "Jane Cooper", status: "Stable", uses: 1240 },
  { name: "Tooltip", owner: "Leslie Alexander", status: "Stable", uses: 868 },
  { name: "Data grid with a very long component name", owner: "Robert Fox", status: "Beta", uses: 312 },
  { name: "Popover", owner: "Jane Cooper", status: "Stable", uses: 640 },
  { name: "Date picker", owner: "Cody Fisher", status: "Beta", uses: 204 },
  { name: "Command palette", owner: "Esther Howard", status: "Planned", uses: 0 },
];

const shade = (status: string) => (status === "Stable" ? "blue" : status === "Beta" ? "orange" : "gray");

export function Default() {
  return (
    <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeadCell>Component</Table.HeadCell>
            <Table.HeadCell>Owner</Table.HeadCell>
            <Table.HeadCell>Status</Table.HeadCell>
            <Table.HeadCell align="right">Weekly uses</Table.HeadCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {components.map((row) => (
            <Table.Row key={row.name}>
              <Table.Cell>{row.name}</Table.Cell>
              <Table.Cell>{row.owner}</Table.Cell>
              <Table.Cell>
                <Pill shade={shade(row.status)} intensity="light" bordered>
                  {row.status}
                </Pill>
              </Table.Cell>
              <Table.Cell align="right">{row.uses.toLocaleString()}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
  );
}

const columns: TableColumn[] = [
  { id: "name", label: "Component" },
  { id: "owner", label: "Owner" },
  { id: "uses", label: "Weekly uses", align: "right" },
];

/** Every header gets the standard menu (sort, move, hide) from one hook: the columns, and a line for each header. */
export function ColumnMenu() {
  const state = useTableColumns(columns);
  return (
    <Table>
      <Table.Header>
        <Table.Row>
          {state.visible.map((column) => (
            <Table.HeadCell key={column.id} {...state.headCell(column)}>
              {column.label}
            </Table.HeadCell>
          ))}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {state.sortRows(components, (row, id) => row[id as keyof typeof row]).map((row) => (
          <Table.Row key={row.name}>
            {state.visible.map((column) => (
              <Table.Cell key={column.id} align={column.align}>
                {row[column.id as keyof typeof row]}
              </Table.Cell>
            ))}
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

/**
 * A column adds items of its own to the standard menu (`menu` on the column), a header can have a menu that is entirely its own
 * (`headCell(column, { menu })`), and what the standard menu offers can be turned off or reworded.
 */
export function CustomColumnMenu() {
  const [note, setNote] = useState("Nothing chosen yet");
  const state = useTableColumns(
    [
      { id: "name", label: "Component", sortable: false },
      {
        id: "owner",
        label: "Owner",
        menu: (
          <ActionMenu.Section label="Owner">
            <ActionMenu.Item onClick={() => setNote("Filtered to Jane Cooper")}>Only Jane Cooper</ActionMenu.Item>
            <ActionMenu.Item onClick={() => setNote("Filter cleared")}>Clear filter</ActionMenu.Item>
          </ActionMenu.Section>
        ),
      },
      { id: "uses", label: "Weekly uses", align: "right" },
    ],
    { hideable: false, labels: { moveToStart: "Move to first" } },
  );
  return (
    <div>
      <Table>
        <Table.Header>
          <Table.Row>
            {state.visible.map((column) => (
              <Table.HeadCell
                key={column.id}
                {...state.headCell(column, column.id === "name" ? { menu: <ActionMenu.Item onClick={() => setNote("Renamed")}>Rename</ActionMenu.Item> } : {})}
              >
                {column.label}
              </Table.HeadCell>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {state.sortRows(components, (row, id) => row[id as keyof typeof row]).map((row) => (
            <Table.Row key={row.name}>
              {state.visible.map((column) => (
                <Table.Cell key={column.id} align={column.align}>
                  {row[column.id as keyof typeof row]}
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <p style={{ margin: "0.75rem 0 0" }}>{note}</p>
    </div>
  );
}

export function Loading() {
  return (
    <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeadCell>Component</Table.HeadCell>
            <Table.HeadCell>Owner</Table.HeadCell>
            <Table.HeadCell align="right">Weekly uses</Table.HeadCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {components.slice(0, 5).map((row, index) => (
            <Table.Row key={row.name}>
              <Table.Cell>{row.name}</Table.Cell>
              <Table.Cell loading={index > 1}>{row.owner}</Table.Cell>
              <Table.Cell align="right" loading={index > 2}>
                {row.uses.toLocaleString()}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
  );
}

/** A table keeps every cell to one line (`rowLayout="truncate"` is the default). Rest the pointer on a cut-off name, or click or tab to it, to see the whole. */
export function TruncatedText() {
  return (
    <div style={{ width: "26rem" }}>
      <Table>
        <colgroup>
          <col style={{ width: "40%" }} />
          <col />
          <col style={{ width: "6rem" }} />
        </colgroup>
        <Table.Header>
          <Table.Row>
            <Table.HeadCell>Component</Table.HeadCell>
            <Table.HeadCell>Owner</Table.HeadCell>
            <Table.HeadCell align="right">Uses</Table.HeadCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {components.map((row) => (
            <Table.Row key={row.name}>
              <Table.Cell>{row.name}</Table.Cell>
              <Table.Cell>{row.owner}</Table.Cell>
              <Table.Cell align="right">{row.uses.toLocaleString()}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
}

const notes = [
  "Opens on hover after a short rest, and on click or focus. The popover is as wide as the cell, so a narrow column makes a tall popover.",
  "Short",
  "Escape closes it, and so does a press anywhere else. It follows the cell when the page scrolls.",
  "A long note with unbrokenwordsthatcannotbewrappedanywhere-and-keep-going-until-the-very-end-of-the-line",
  "Another long note, to put a cut-off cell in every row and every column.",
];

/** Columns from narrow to wide, each cut off: the popover is as wide as its own column, wherever the cell is. */
export function TruncatedColumnWidths() {
  return (
    <div style={{ width: "40rem" }}>
      <Table>
        <colgroup>
          <col style={{ width: "7rem" }} />
          <col style={{ width: "12rem" }} />
          <col />
        </colgroup>
        <Table.Header>
          <Table.Row>
            <Table.HeadCell>Narrow</Table.HeadCell>
            <Table.HeadCell>Medium</Table.HeadCell>
            <Table.HeadCell>Wide</Table.HeadCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {notes.map((note, index) => (
            <Table.Row key={index}>
              <Table.Cell>{note}</Table.Cell>
              <Table.Cell>{note}</Table.Cell>
              <Table.Cell>{note}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
}

/** Cells are cut off by default, and a cell can wrap instead: its own `rowLayout` wins over the table's. */
export function TruncatedAndWrapped() {
  return (
    <div style={{ width: "36rem" }}>
      <Table>
        <colgroup>
          <col style={{ width: "12rem" }} />
          <col />
        </colgroup>
        <Table.Header>
          <Table.Row>
            <Table.HeadCell>Cut off</Table.HeadCell>
            <Table.HeadCell>Wraps</Table.HeadCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {notes.slice(0, 4).map((note, index) => (
            <Table.Row key={index}>
              <Table.Cell>{note}</Table.Cell>
              <Table.Cell rowLayout="wrap">{note}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
}

/** Content that is not text can still say what it holds: `fullText` is what the popover shows. */
export function TruncatedRichContent() {
  return (
    <div style={{ width: "22rem" }}>
      <Table>
        <colgroup>
          <col style={{ width: "14rem" }} />
          <col />
        </colgroup>
        <Table.Header>
          <Table.Row>
            <Table.HeadCell>Owner</Table.HeadCell>
            <Table.HeadCell>Status</Table.HeadCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {components.map((row) => (
            <Table.Row key={row.name}>
              <Table.Cell fullText={`${row.owner}, owner of ${row.name}`}>
                <strong>{row.owner}</strong> owns {row.name}
              </Table.Cell>
              <Table.Cell>
                <Pill shade={shade(row.status)} intensity="light" bordered>
                  {row.status}
                </Pill>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
}

const wide = [
  { id: "name", label: "Component", width: "14rem" },
  { id: "owner", label: "Owner", width: "12rem" },
  { id: "status", label: "Status", width: "9rem" },
  { id: "uses", label: "Weekly uses", width: "9rem" },
  { id: "note", label: "Notes", width: "20rem" },
] as const;

/**
 * `layout="scroll"` gives each column the width its `col` says. In a container wider than them all the table fills it; in a narrower one the
 * frame scrolls sideways. Make the frame wider and narrower to see both. Cells still cut off their text and show the whole of it.
 */
export function ScrollingColumns() {
  return (
    <div style={{ width: "36rem" }}>
      <Table layout="scroll">
        <colgroup>
          {wide.map((column) => (
            <col key={column.id} style={{ width: column.width }} />
          ))}
        </colgroup>
        <Table.Header>
          <Table.Row>
            {wide.map((column) => (
              <Table.HeadCell key={column.id}>{column.label}</Table.HeadCell>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {components.map((row, index) => (
            <Table.Row key={row.name}>
              <Table.Cell>{row.name}</Table.Cell>
              <Table.Cell>{row.owner}</Table.Cell>
              <Table.Cell>{row.status}</Table.Cell>
              <Table.Cell>{row.uses.toLocaleString()}</Table.Cell>
              <Table.Cell>{notes[index % notes.length]}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
}

/** `rowLayout="wrap"` lets every cell take as many lines as it needs, so nothing is cut off. */
export function WrappedText() {
  return (
    <Table rowLayout="wrap">
      <Table.Header>
        <Table.Row>
          <Table.HeadCell>Component</Table.HeadCell>
          <Table.HeadCell>Note</Table.HeadCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {notes.slice(0, 4).map((note, index) => (
          <Table.Row key={index}>
            <Table.Cell>{components[index].name}</Table.Cell>
            <Table.Cell>{note}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

/** Rows are dense (32px) by default; `density="spacious"` gives them 40px. */
export function Spacious() {
  return (
    <Table density="spacious">
      <Table.Header>
        <Table.Row>
          <Table.HeadCell>Component</Table.HeadCell>
          <Table.HeadCell>Owner</Table.HeadCell>
          <Table.HeadCell align="right">Weekly uses</Table.HeadCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {components.map((row) => (
          <Table.Row key={row.name}>
            <Table.Cell>{row.name}</Table.Cell>
            <Table.Cell>{row.owner}</Table.Cell>
            <Table.Cell align="right">{row.uses.toLocaleString()}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

export function RowLines() {
  return (
    <Table lines="rows">
        <Table.Header>
          <Table.Row>
            <Table.HeadCell>Component</Table.HeadCell>
            <Table.HeadCell>Owner</Table.HeadCell>
            <Table.HeadCell align="right">Weekly uses</Table.HeadCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {components.map((row) => (
            <Table.Row key={row.name}>
              <Table.Cell>{row.name}</Table.Cell>
              <Table.Cell>{row.owner}</Table.Cell>
              <Table.Cell align="right">{row.uses.toLocaleString()}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
  );
}
