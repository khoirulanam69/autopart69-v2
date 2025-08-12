
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { AuthGuard } from '@/components/AuthGuard';

const Settings = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, user } = useAuth();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Mohon isi email dan password",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password minimal 6 karakter",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password);
    
    if (error) {
      if (error.message.includes("already registered")) {
        toast({
          title: "Error Registrasi",
          description: "Email sudah terdaftar",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error Registrasi",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Registrasi Berhasil",
        description: "User baru berhasil didaftarkan",
      });
      setEmail('');
      setPassword('');
    }
    setLoading(false);
  };

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Tabs defaultValue="user-management" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="user-management">Manajemen User</TabsTrigger>
                <TabsTrigger value="system">Sistem</TabsTrigger>
              </TabsList>
              
              <TabsContent value="user-management">
                <Card>
                  <CardHeader>
                    <CardTitle>Daftar User Baru</CardTitle>
                    <CardDescription>
                      Tambahkan user baru ke sistem
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-email">Email</Label>
                        <Input
                          id="new-email"
                          type="email"
                          placeholder="nama@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="Minimal 6 karakter"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" disabled={loading}>
                        {loading ? "Loading..." : "Daftar User Baru"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="system">
                <Card>
                  <CardHeader>
                    <CardTitle>Pengaturan Sistem</CardTitle>
                    <CardDescription>
                      Konfigurasi sistem bengkel
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>User Aktif</Label>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                      </div>
                      {/* Placeholder untuk pengaturan sistem lainnya */}
                      <div className="text-sm text-muted-foreground">
                        Pengaturan sistem akan ditambahkan di sini
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
};

export default Settings;
