// components/ClientNav.tsx
import dynamic from "next/dynamic";

// Renders Nav only on the client → no SSR, no hydration mismatch
export default dynamic(() => import("./Nav"), { ssr: false });

