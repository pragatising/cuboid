// Cuboid's source is type-checked as part of this package (see `paths` in tsconfig), and it imports CSS modules.
declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}
