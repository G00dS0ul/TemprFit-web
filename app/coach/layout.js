import RoleGate from '@/components/RoleGate';

export default function Layout({ children }) {
  return <RoleGate allowedRoles={['user', 'admin']}>{children}</RoleGate>;
}
