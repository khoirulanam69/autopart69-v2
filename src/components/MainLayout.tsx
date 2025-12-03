
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { AuthGuard } from './AuthGuard';
import { useIsMobile } from '@/hooks/use-mobile';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <AuthGuard requireAuth={true}>
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full overflow-x-hidden relative">
          <AppSidebar />
          <SidebarInset className="w-full overflow-x-hidden">
            <main className="flex-1 overflow-x-hidden w-full">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
