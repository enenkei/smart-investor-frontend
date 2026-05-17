"use client"
import { useState } from "react";
import { useAuthStore } from "@/store/use-auth-store";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User, Lock, Check, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { changePassword, getMe, updateProfile, getAvailableAvatars } from "@/controllers/user-controller";
import { useEffect } from "react";

export function UserSettingsDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const { user, setAuth, sessionId } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("profile");
    const [availableAvatars, setAvailableAvatars] = useState<string[]>([]);

    const [fullName, setFullName] = useState("");
    const [pseudo, setPseudo] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        if (user) {
            setFullName(user.fullName || "");
            setPseudo(user.pseudo || "");
            setAvatarUrl(user.avatarUrl || "");
        }
    }, [user]);

    useEffect(() => {
        if (open) {
            getAvailableAvatars().then((avatars) => {
                setAvailableAvatars(avatars);
            });
        }
    }, [open]);


    const handleUpdateProfile = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await updateProfile(user.id, fullName, pseudo, avatarUrl);
            const updatedUser: any = await getMe();
            setAuth(updatedUser, sessionId);
            toast.success("Profile updated successfully");
            onOpenChange(false);
        } catch (err) {
            toast.error("Error: " + err);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!user) return;
        if (!newPassword) return;
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        setLoading(true);
        try {
            await changePassword(user.id, newPassword);
            toast.success("Password changed successfully");
            setNewPassword("");
            setConfirmPassword("");
            onOpenChange(false);
        } catch (err) {
            toast.error("Error: " + err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl w-full p-0 overflow-hidden gap-0 border-none shadow-2xl">

                <DialogTitle />
                <div className="flex h-[750px] bg-background">
                    <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="flex w-full h-full">
                        {/* Sidebar Navigation */}
                        <div className="w-[250px] border-r bg-muted/20 p-3 flex flex-col gap-6">
                            <div className="space-y-1">
                                <h2 className="text-xl font-bold tracking-tight">Settings</h2>
                                <p className="text-xs text-muted-foreground">Manage your account preferences</p>
                            </div>

                            <TabsList className="flex flex-col h-auto bg-transparent p-0 gap-2">
                                <TabsTrigger value="profile" className="w-full justify-start gap-3 h-11 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-sm transition-all text-sm font-medium">
                                    <User className="h-4 w-4" />
                                    Personal Profile
                                </TabsTrigger>
                                <TabsTrigger value="password" className="w-full justify-start gap-3 h-11 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-sm transition-all text-sm font-medium">
                                    <Lock className="h-4 w-4" />
                                    Security & Password
                                </TabsTrigger>
                            </TabsList>

                            <div className="mt-auto pt-6 border-t border-border/50">
                                <div className="flex items-center gap-3 px-2">
                                    <Avatar className="h-8 w-8 border border-border">
                                        <AvatarImage src={avatarUrl || ""} />
                                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold truncate max-w-[120px]">{pseudo || user?.email}</span>
                                        <span className="text-[10px] text-muted-foreground">Logged in</span>
                                    </div>

                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 flex flex-col overflow-y-auto">
                            {/* <ScrollArea className="flex-1"> */}
                            <div className="p-8">
                                <TabsContent value="profile" className="mt-0 space-y-8 outline-none">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-bold tracking-tight">Profile Details</h3>
                                        <p className="text-muted-foreground text-sm">How you appear to the system and others.</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <ImageIcon className="h-4 w-4 text-primary" />
                                                <Label className="text-base font-semibold">Choose your Avatar</Label>
                                            </div>
                                            <div className="grid grid-cols-6 gap-3">
                                                {availableAvatars.length === 0 && (
                                                    <div className="col-span-6 py-10 text-center text-muted-foreground italic">
                                                        No avatars found in public/images/avatars
                                                    </div>
                                                )}
                                                {availableAvatars.map((url: string) => (
                                                    <button
                                                        key={url}
                                                        onClick={() => setAvatarUrl(url)}
                                                        className={cn(
                                                            "group relative h-16 w-16 rounded-xl overflow-hidden border-2 transition-all hover:scale-105 active:scale-95",
                                                            avatarUrl === url
                                                                ? "border-primary ring-4 ring-primary/10 shadow-lg"
                                                                : "border-muted-foreground/10 hover:border-primary/50"
                                                        )}
                                                    >
                                                        <img src={url} alt="Avatar" className="h-full w-full object-cover" />
                                                        {avatarUrl === url && (
                                                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                                <div className="bg-primary text-white p-0.5 rounded-full shadow-sm">
                                                                    <Check className="h-3 w-3" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6 pt-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="full-name" className="text-sm font-semibold">Real Name</Label>
                                                <Input
                                                    id="full-name"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    placeholder="John Doe"
                                                    className="h-11 bg-muted/30 border-muted-foreground/20 focus:bg-background"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="pseudo" className="text-sm font-semibold">Public Pseudo</Label>
                                                <Input
                                                    id="pseudo"
                                                    value={pseudo}
                                                    onChange={(e) => setPseudo(e.target.value)}
                                                    placeholder="Investor01"
                                                    className="h-11 bg-muted/30 border-muted-foreground/20 focus:bg-background"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="password" className="mt-0 space-y-8 outline-none">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-bold tracking-tight">Security</h3>
                                        <p className="text-muted-foreground text-sm">Keep your administrative access secure.</p>
                                    </div>

                                    <div className="space-y-4 max-w-md">
                                        <div className="space-y-2">
                                            <Label htmlFor="new-password">New Password</Label>
                                            <Input
                                                id="new-password"
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="h-11 bg-muted/30 border-muted-foreground/20"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirm-password">Confirm Password</Label>
                                            <Input
                                                id="confirm-password"
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="h-11 bg-muted/30 border-muted-foreground/20"
                                            />
                                        </div>
                                    </div>
                                </TabsContent>
                            </div>
                            {/* </ScrollArea> */}

                            {/* Action Buttons Footer */}
                            {activeTab !== "config" && (
                                <div className="p-8 border-t bg-muted/10 flex-shrink-0">
                                    <Button
                                        onClick={activeTab === "profile" ? handleUpdateProfile : handleChangePassword}
                                        disabled={loading || (activeTab === "password" && !newPassword)}
                                        className="w-full h-12 text-base font-bold shadow-xl shadow-primary/20"
                                    >
                                        {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                                        {activeTab === "profile" ? "Save Profile Changes" : "Update Password"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}