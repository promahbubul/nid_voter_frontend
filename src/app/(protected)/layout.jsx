import { ProtectedShell } from "../../components/protected-shell";

export default function ProtectedLayout({ children }) {
  return <ProtectedShell>{children}</ProtectedShell>;
}
