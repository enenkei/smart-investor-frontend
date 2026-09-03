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
import { Loader2, User, Lock, Check, Image as ImageIcon, Palette, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { changePassword, getMe, updateProfile, getAvailableAvatars } from "@/controllers/user-controller";
import { useEffect } from "react";
import { useTheme } from "next-themes";
import { THEMES } from "@/components/theme/theme-switcher";

export function UserSettingsDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const { user, setAuth, sessionId } = useAuthStore();
    const { theme, setTheme } = useTheme();
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
                                <TabsTrigger value="appearance" className="w-full justify-start gap-3 h-11 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-sm transition-all text-sm font-medium">
                                    <Palette className="h-4 w-4" />
                                    Appearance & Themes
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

                                <TabsContent value="appearance" className="mt-0 space-y-6 outline-none">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="h-5 w-5 text-primary" />
                                            <h3 className="text-2xl font-bold tracking-tight">Appearance & Color Themes</h3>
                                        </div>
                                        <p className="text-muted-foreground text-sm">
                                            Choose from 8 curated visual themes tailored for high contrast and readability.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                                        {THEMES.map((t) => {
                                            const isSelected = theme === t.id;
                                            return (
                                                <div
                                                    key={t.id}
                                                    onClick={() => {
                                                        setTheme(t.id);
                                                        toast.success(`Theme switched to ${t.name}`);
                                                    }}
                                                    className={cn(
                                                        "relative p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col gap-3 group hover:border-primary/60 hover:shadow-md",
                                                        isSelected
                                                            ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/40"
                                                            : "border-border bg-card hover:bg-accent/5"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-sm tracking-tight">{t.name}</span>
                                                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                                                {t.category}
                                                            </span>
                                                        </div>
                                                        {isSelected && (
                                                            <span className="flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                                                                <Check className="w-3 h-3" /> Active
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>

                                                    {/* Color preview card */}
                                                    <div
                                                        className="rounded-lg p-2.5 border border-border/60 flex items-center justify-between"
                                                        style={{ backgroundColor: t.background }}
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            <div
                                                                className="w-4 h-4 rounded-full flex items-center justify-center border border-border/40"
                                                                style={{ backgroundColor: t.primary }}
                                                            >
                                                                <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                                                            </div>
                                                            <span className="text-[10px] font-bold tracking-tight" style={{ color: t.primary }}>
                                                                Primary
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-1.5">
                                                            <span
                                                                className="w-3 h-3 rounded-full border border-border/40 shadow-xs"
                                                                style={{ backgroundColor: t.primary }}
                                                                title="Primary"
                                                            />
                                                            <span
                                                                className="w-3 h-3 rounded-full border border-border/40 shadow-xs"
                                                                style={{ backgroundColor: t.accent }}
                                                                title="Accent"
                                                            />
                                                            <span
                                                                className="w-3 h-3 rounded-full border border-border/40 shadow-xs"
                                                                style={{ backgroundColor: t.background }}
                                                                title="Background"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </TabsContent>
                            </div>
                            {/* </ScrollArea> */}

                            {/* Action Buttons Footer */}
                            {(activeTab === "profile" || activeTab === "password") && (
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