import SidebarLayout from '../components/layout/Sidebar';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarLayout>
      {children}
    </SidebarLayout>
  );
};

export default AdminLayout;
