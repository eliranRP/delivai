// Allow Vite `?url` CSS imports (used by @shopify/polaris in root.tsx).
// Wildcard module declarations must be in an ambient (non-module) file.
declare module "*.css?url" {
  const url: string;
  export default url;
}
