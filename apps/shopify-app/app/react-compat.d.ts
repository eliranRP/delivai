// Module augmentation (requires export {} to be a module file, not ambient).
// Fixes: 'Outlet'/'Link' cannot be used as JSX component.
// Root cause: pnpm monorepo has both @types/react@18 (shopify-app) and @types/react@19
// (marketing-site). @remix-run/react types resolve against React 19 which makes
// ReactPortal.children optional and adds bigint to ReactNode. This aligns React 18
// to accept those return types.
declare module "react" {
  interface ReactPortal {
    children?: ReactNode;
  }
}

export {};
