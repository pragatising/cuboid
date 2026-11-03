import { Box, Heading, Sidebar, SplitLayout, Text } from "@sragatiping/cuboid";
import type { Frame } from "@sragatiping/bench/example";

export function WithSidebar() {
  return (
    <SplitLayout style={{ height: 320 }}>
      <Sidebar aria-label="Primary" width="sm">
        <Sidebar.Body>
          <Sidebar.Section label="Section">
            <Sidebar.Item href="#one" current>One</Sidebar.Item>
            <Sidebar.Item href="#two">Two</Sidebar.Item>
          </Sidebar.Section>
        </Sidebar.Body>
      </Sidebar>
      <SplitLayout.Main>
        <Box gap="1x" padding="3x">
          <Heading as="h1" size="h3">Main</Heading>
          <Text color="neutral.muted">The sidebar keeps its width; the main area takes the rest and scrolls on its own.</Text>
        </Box>
      </SplitLayout.Main>
    </SplitLayout>
  );
}
WithSidebar.frame = { height: 340 } satisfies Frame;
