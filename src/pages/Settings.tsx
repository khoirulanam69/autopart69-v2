
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AuthGuard } from '@/components/AuthGuard';
import { api } from '@/lib/api';

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at?: string;
};

type EditUserForm = ManagedUser & { password: string };

const Settings = () => {
  useEffect(() => {
    document.title = 'Settings | Autopart69';
  }, []);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [availableRoles, setAvailableRoles] = useState<string[]>(['staff']);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditUserForm>({ id: '', name: '', email: '', role: 'staff', password: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.role !== 'admin') return;

    setUsersLoading(true);
    Promise.all([api.getRoles(), api.getUsers()])
      .then(([{ roles, defaultRole }, usersResponse]) => {
        const nextRoles = roles.length ? roles : ['staff'];
        setAvailableRoles(nextRoles);
        setRole(defaultRole || 'staff');
        setUsers(usersResponse.data);
      })
      .catch((error) => {
        setAvailableRoles(['admin', 'staff']);
        setRole('staff');
        toast({
          title: 'Gagal memuat user',
          description: error.message || 'Data user tidak dapat dimuat',
          variant: 'destructive',
        });
      })
      .finally(() => setUsersLoading(false));
  }, [toast, user?.role]);

  const openEditDialog = (selectedUser: ManagedUser) => {
    setEditForm({ ...selectedUser, password: '' });
    setEditDialogOpen(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name || !editForm.email || !editForm.role) {
      toast({ title: 'Error', description: 'Nama, email, dan role wajib diisi', variant: 'destructive' });
      return;
    }

    if (editForm.password && editForm.password.length < 6) {
      toast({ title: 'Error', description: 'Password minimal 6 karakter', variant: 'destructive' });
      return;
    }

    setEditLoading(true);
    try {
      const { user: updatedUser } = await api.updateUser(editForm.id, {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        ...(editForm.password ? { password: editForm.password } : {}),
      });
      setUsers((currentUsers) => currentUsers.map((item) => item.id === updatedUser.id ? updatedUser : item));
      setEditDialogOpen(false);
      toast({ title: 'User diperbarui', description: 'Data user berhasil disimpan' });
    } catch (error: any) {
      toast({ title: 'Gagal memperbarui user', description: error.message, variant: 'destructive' });
    } finally {
      setEditLoading(false);
    }
  };

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
    const { error, user: createdUser } = await signUp(name, email, password, role);
    
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
      if (createdUser) setUsers((currentUsers) => [createdUser, ...currentUsers]);
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
              
              <TabsContent value="user-management" className="space-y-4">
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

                <Card>
                  <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Kelola data dan role user yang sudah terdaftar</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {usersLoading ? (
                        <p className="text-sm text-muted-foreground">Memuat data user...</p>
                      ) : users.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Belum ada data user</p>
                      ) : (
                        users.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                            <div className="min-w-0">
                              <p className="truncate font-medium">{item.name || '-'}</p>
                              <p className="truncate text-sm text-muted-foreground">{item.email}</p>
                              <p className="text-xs uppercase text-muted-foreground">{item.role}</p>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => openEditDialog(item)}>
                              Edit
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
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

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Perbarui data user dan role akses</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nama</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm((current) => ({ ...current, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((current) => ({ ...current, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">Password Baru</Label>
                <Input
                  id="edit-password"
                  type="password"
                  placeholder="Kosongkan jika tidak diubah"
                  value={editForm.password}
                  onChange={(e) => setEditForm((current) => ({ ...current, password: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select value={editForm.role} onValueChange={(value) => setEditForm((current) => ({ ...current, role: value }))}>
                  <SelectTrigger id="edit-role">
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
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={editLoading}>
                  {editLoading ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
};

export default Settings;
