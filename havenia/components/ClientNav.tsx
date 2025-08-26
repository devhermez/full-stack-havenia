// components/ClientNav.tsx
import dynamic from "next/dynamic";

// Renders Nav only on the client → no SSR, no hydration mismatch
type props = { authed?: boolean; onSignOut?: () => void }
export default dynamic<props>(() => import("./Nav"), { ssr: false });

