import { Prose } from "@sragatiping/cuboid";

/** Styles the plain HTML inside it: for text that arrives as markup (Markdown output, a CMS) and cannot be given components. */
export function Document() {
  return (
    <Prose>
      <h1>Heading one</h1>
      <p>A paragraph of body text, with a <a href="#x">link</a> and some <code>inline code</code>.</p>
      <h2>Heading two</h2>
      <p>Rows are a gap apart; a heading adds its own space above, more for a higher level.</p>
      <ul>
        <li>First item</li>
        <li>Second item</li>
      </ul>
      <blockquote>A quotation.</blockquote>
      <h3>Heading three</h3>
      <p>Last paragraph.</p>
    </Prose>
  );
}
