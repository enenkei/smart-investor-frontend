"use client"
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Settings,
    Save,
    RefreshCw,
    Plus,
    Trash2,
    Loader2Icon,
    KeyRound,
    Eye,
    EyeOff
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
import { SystemSetting } from "@/generated/prisma/client";
import { getSystemSettings, updateSystemSettings, deleteSystemSetting } from "@/controllers/setting-controller";

const SettingView = () => {
    const [settings, setSettings] = useState<SystemSetting[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [visibleRows, setVisibleRows] = useState<Record<number, boolean>>({});

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const data = await getSystemSettings();
            setSettings(data);
        } catch (err) {
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateSystemSettings(settings);
            toast.success("Settings saved successfully");
            fetchSettings();
        } catch (err) {
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const handleAddRow = () => {
        const newSetting: any = {
            id: 0,
            key: "",
            name: "",
            description: "",
            value: "",
            updatedAt: new Date()
        };
        setSettings([...settings, newSetting]);
    };

    const handleUpdateRow = (index: number, field: keyof SystemSetting, value: string) => {
        const updated = [...settings];
        (updated[index] as any)[field] = value;
        setSettings(updated);
    };

    const toggleVisibility = (index: number) => {
        setVisibleRows(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const handleDelete = async (key: string, index: number) => {
        if (!key) {
            const updated = [...settings];
            updated.splice(index, 1);
            setSettings(updated);
            return;
        }

        if (!confirm("Are you sure you want to delete this setting?")) return;
        
        try {
            await deleteSystemSetting(key);
            toast.success("Setting deleted successfully");
            fetchSettings();
        } catch (err) {
            toast.error("Failed to delete setting");
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Settings className="h-8 w-8 text-primary" />
                        System Configuration
                    </h2>
                    <p className="text-muted-foreground mt-1 text-lg">Manage global environment variables and application settings.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="lg" onClick={fetchSettings} disabled={loading || saving} className="gap-2 border-primary/20 hover:bg-primary/5">
                        {loading ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Refresh
                    </Button>
                    <Button variant="secondary" size="lg" onClick={handleAddRow} disabled={loading || saving} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Setting
                    </Button>
                    <Button size="lg" onClick={handleSave} disabled={loading || saving} className="gap-2 shadow-lg shadow-primary/20">
                        {saving ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save All Changes
                    </Button>
                </div>
            </div>

            <div className="bg-white border rounded-none overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[200px] font-bold">Key (Unique)</TableHead>
                            <TableHead className="w-[200px] font-bold">Name</TableHead>
                            <TableHead className="font-bold">Description</TableHead>
                            <TableHead className="w-[300px] font-bold">Value (Encrypted)</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {settings.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                    No settings found. Click "Add Setting" to create one.
                                </TableCell>
                            </TableRow>
                        )}
                        {settings.map((setting, index) => (
                            <TableRow key={index} className="group hover:bg-slate-50/50 transition-colors">
                                <TableCell>
                                    <Input
                                        value={setting.key}
                                        onChange={(e) => handleUpdateRow(index, 'key', e.target.value)}
                                        placeholder="e.target.AI_MODEL"
                                        className="h-9 font-mono text-sm border-slate-200"
                                        disabled={setting.id !== 0} // Only allow key editing for new rows
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        value={setting.name || ""}
                                        onChange={(e) => handleUpdateRow(index, 'name', e.target.value)}
                                        placeholder="Display Name"
                                        className="h-9 border-slate-200"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        value={setting.description || ""}
                                        onChange={(e) => handleUpdateRow(index, 'description', e.target.value)}
                                        placeholder="Context about this setting"
                                        className="h-9 border-slate-200"
                                    />
                                </TableCell>
                                <TableCell className="relative">
                                    <Input
                                        type={visibleRows[index] ? "text" : "password"}
                                        value={setting.value}
                                        onChange={(e) => handleUpdateRow(index, 'value', e.target.value)}
                                        placeholder="Value"
                                        className="h-9 border-slate-200 pr-10 font-mono"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => toggleVisibility(index)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                    >
                                        {visibleRows[index] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(setting.key, index)}
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
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-slate-50 p-4 border rounded-none">
                <div className="p-1 rounded bg-amber-100 text-amber-700">
                    <KeyRound className="h-3 w-3" />
                </div>
                <span>Settings with "key", "pass", or "url" in their identifier are automatically masked and XOR-Hex encrypted at the database level.</span>
            </div>
        </div>
    );
};

export default SettingView;