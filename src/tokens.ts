/**
 * Public foundation tokens for app styling — import from `@sragatiping/cuboid/tokens`.
 *
 * Use Cuboid components for component-specific recipes; do not rely on
 * `colors.functional.*` or component layout tokens in app code.
 */
export {
  foundationTokens,
  tokens,
  token,
} from "./theme/foundationTokens";

export type {
  FoundationTokens,
  FoundationTypography,
  FoundationSizes,
  FoundationTokenPath,
} from "./theme/foundationTypes";

export {
  resolveGlobalColor,
  resolveGlobalColorOrCss,
  GLOBAL_COLOR_PATH_EXAMPLES,
} from "./theme/globalColor";

export type {
  GlobalColors,
  GlobalColorPath,
  GlobalTextColors,
  GlobalCanvasColors,
  GlobalSemanticColorPair,
  FontFamilyTokens,
  FontSizeTokens,
  FontWeightTokens,
  LineHeightTokens,
  TextStyle,
  TextTokens,
  SpaceTokens,
  SpaceScaleTokens,
  SpaceScale,
  SpacePxKey,
  SpaceToken,
  StackGapTokens,
  StackPaddingTokens,
  StackGap,
  StackPadding,
  LayoutTokens,
  ContainerSizesTokens,
  BorderRadiusTokens,
  BorderWidthTokens,
  BreakpointTokens,
  ZIndexTokens,
  ShadowTokens,
} from "./theme/types";
