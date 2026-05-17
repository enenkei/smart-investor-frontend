"use client"
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Users,
    UserPlus,
    Trash2,
    Loader2Icon,
    RefreshCw,
    Shield,
    Mail,
    User as UserIcon,
    Calendar
} from "lucide-react";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getAllUsers, createUser, deleteUser, getAvailableAvatars } from "@/controllers/user-controller";
import { User } from "@/generated/prisma/client";


const UserManagementView = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<{ id: number; email: string } | null>(null);
    const [availableAvatars, setAvailableAvatars] = useState<string[]>([]);
    
    const [newUser, setNewUser] = useState({
        email: "",
        password: "password123",
        fullName: "",
        pseudo: "",
        role: "USER",
        avatarUrl: ""
    });

    const resetNewUser = (avatars: string[] = availableAvatars) => {
        const randomAvatar = avatars.length > 0 
            ? avatars[Math.floor(Math.random() * avatars.length)] 
            : "";
            
        const randomId = Math.floor(Math.random() * 1000);
        setNewUser({
            email: "investor_" + randomId + "@example.com",
            password: "password123",
            fullName: "",
            pseudo: "investor_" + randomId,
            role: "USER",
            avatarUrl: randomAvatar
        });
    };


    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getAllUsers();
            setUsers(data as any);
        } catch (err) {
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async () => {
        if (!newUser.email || !newUser.password) {
            toast.error("Email and password are required");
            return;
        }

        try {
            await createUser(newUser as any);
            toast.success("User created successfully");
            setIsAddDialogOpen(false);
            fetchUsers();
            resetNewUser();
        } catch (err) {
            toast.error("Failed to create user. Email might already exist.");
        }
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;
        
        setLoading(true);
        try {
            const success = await deleteUser(userToDelete.id);
            if (success) {
                toast.success("User deleted successfully");
                fetchUsers();
            } else {
                toast.error("Failed to delete user");
            }
        } catch (err) {
            toast.error("An error occurred while deleting user");
        } finally {
            setLoading(false);
            setIsDeleteDialogOpen(false);
            setUserToDelete(null);
        }
    };

    const handleDeleteUser = (userId: number, email: string) => {
        setUserToDelete({ id: userId, email });
        setIsDeleteDialogOpen(true);
    };


    useEffect(() => {
        fetchUsers();
        getAvailableAvatars().then(avatars => {
            setAvailableAvatars(avatars);
            resetNewUser(avatars);
        });
    }, []);


    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 mt-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Users className="h-8 w-8 text-primary" />
                        User Management
                    </h2>
                    <p className="text-muted-foreground mt-1 text-lg">Manage application users, roles, and access permissions.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="lg" onClick={fetchUsers} disabled={loading} className="gap-2 border-primary/20 hover:bg-primary/5">
                        {loading ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Refresh
                    </Button>

                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                                <UserPlus className="h-4 w-4" />
                                Add User
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Add New User</DialogTitle>
                                <DialogDescription>
                                    Manually create a user with a preset email and password.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="flex flex-col items-center justify-center gap-2 pb-2">
                                    <img 
                                        src={newUser.avatarUrl || '/images/avatar.png'} 
                                        alt="Random Avatar" 
                                        className="h-20 w-20 rounded-full border-2 border-primary/20 shadow-md object-cover"
                                    />
                                    <span className="text-xs text-muted-foreground italic">Randomly assigned avatar</span>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Full Name</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="John Doe"
                                            className="pl-10"
                                            value={newUser.fullName}
                                            onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="email@example.com"
                                            className="pl-10 font-mono"
                                            value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Password</label>
                                    <div className="relative">
                                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="text"
                                            className="pl-10 font-mono"
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Public Pseudo</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Investor01"
                                            className="pl-10"
                                            value={newUser.pseudo}
                                            onChange={(e) => setNewUser({ ...newUser, pseudo: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Role</label>
                                    <Select
                                        value={newUser.role}
                                        onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="USER">User</SelectItem>
                                            <SelectItem value="ADMIN">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateUser}>Create User</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-destructive">
                                    <Trash2 className="h-5 w-5" />
                                    Confirm Deletion
                                </DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete user <span className="font-bold text-foreground">{userToDelete?.email}</span>? This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="mt-4">
                                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={loading}>
                                    Cancel
                                </Button>
                                <Button 
                                    variant="destructive" 
                                    onClick={confirmDeleteUser} 
                                    disabled={loading}
                                    className="gap-2"
                                >
                                    {loading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    Delete User
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                </div>
            </div>

            <div className="bg-white border rounded-none overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="font-bold">User Information</TableHead>
                            <TableHead className="w-[150px] font-bold">Role</TableHead>
                            <TableHead className="w-[200px] font-bold">Joined</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        )}
                        {users.map((user) => (
                            <TableRow key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-4 justify-start">
                                        <img src={user.avatarUrl || '/images/avatar.png'} alt={user.fullName || user.pseudo || "No Name"} width={48} height={48} className="rounded-full" />
                                        <div className="flex flex-col">
                                            <span className="font-medium">{user.fullName || "No Name"}&nbsp;({user.pseudo})</span>
                                            <span className="text-sm text-muted-foreground font-mono">{user.email}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                        }`}>
                                        {user.role}
                                    </span>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteUser(user.id, user.email)}
                                        className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default UserManagementView;
