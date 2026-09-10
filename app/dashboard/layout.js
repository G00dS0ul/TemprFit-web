import RoleGate from '@/components/RoleGate';

export default function DashboardLayout({ children }) {
  return <RoleGate allowedRoles={['user', 'admin']}>{children}</RoleGate>;
}
