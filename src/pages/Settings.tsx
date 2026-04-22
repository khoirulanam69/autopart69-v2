
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AuthGuard } from '@/components/AuthGuard';
import { api } from '@/lib/api';

const Settings = () => {
  useEffect(() => {
    document.title = 'Settings | Autopart69';
  }, []);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [availableRoles, setAvailableRoles] = useState<string[]>(['staff']);
  const [loading, setLoading] = useState(false);
  const { signUp, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.role !== 'admin') return;

    api.getRoles()
      .then(({ roles, defaultRole }) => {
        setAvailableRoles(roles.length ? roles : ['staff']);
        setRole(defaultRole || 'staff');
      })
      .catch(() => {
        setAvailableRoles(['admin', 'staff']);
        setRole('staff');
      });
  }, [user?.role]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast({
        title: "Error",
        description: "Mohon isi nama, email, dan password",
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
    const { error } = await signUp(name, email, password, role);
    
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
      setName('');
      setEmail('');
      setPassword('');
      setRole(availableRoles.includes('staff') ? 'staff' : availableRoles[0] || 'staff');
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
                        <Label htmlFor="new-name">Nama</Label>
                        <Input
                          id="new-name"
                          type="text"
                          placeholder="Nama lengkap"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
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
                      <div className="space-y-2">
                        <Label htmlFor="new-role">Role</Label>
                        <Select value={role} onValueChange={setRole}>
                          <SelectTrigger id="new-role">
                            <SelectValue placeholder="Pilih role" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableRoles.map((item) => (
                              <SelectItem key={item} value={item}>
                                {item.charAt(0).toUpperCase() + item.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
