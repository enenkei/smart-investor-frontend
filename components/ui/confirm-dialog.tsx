"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: React.ReactNode;
    description?: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: "destructive" | "default" | "outline" | "secondary";
    loading?: boolean;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
    icon?: React.ReactNode;
    className?: string;
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title = "Are you sure?",
    description = "This action cannot be undone.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "destructive",
    loading: externalLoading,
    onConfirm,
    onCancel,
    icon,
    className,
}: ConfirmDialogProps) {
    const [internalLoading, setInternalLoading] = React.useState(false);
    const isLoading = externalLoading ?? internalLoading;

    const handleConfirm = async () => {
        try {
            setInternalLoading(true);
            await onConfirm();
            onOpenChange(false);
        } catch (error) {
            console.error("Confirm action failed:", error);
        } finally {
            setInternalLoading(false);
        }
    };

    const handleCancel = () => {
        if (isLoading) return;
        onCancel?.();
        onOpenChange(false);
    };

    const defaultIcon = variant === "destructive" ? (
        <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
    ) : null;

    return (
        <Dialog
            open={open}
            onOpenChange={(val) => {
                if (!val && isLoading) return;
                onOpenChange(val);
            }}
        >
            <DialogContent className={cn("rounded-none border-border/60 bg-card/95 backdrop-blur-xl sm:max-w-md", className)}>
                <DialogHeader className="gap-2">
                    <div className="flex items-center gap-2">
                        {icon !== undefined ? icon : defaultIcon}
                        <DialogTitle
                            className={cn(
                                "text-lg font-black uppercase tracking-tight",
                                variant === "destructive" && "text-destructive"
                            )}
                        >
                            {title}
                        </DialogTitle>
                    </div>
                    {description && (
                        <DialogDescription className="text-xs font-medium text-muted-foreground leading-relaxed">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>
                <DialogFooter className="gap-2 mt-4 sm:justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="rounded-none font-bold uppercase text-[10px] tracking-widest h-8"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        variant={variant}
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="rounded-none font-bold uppercase text-[10px] tracking-widest gap-1.5 h-8"
                    >
                        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ConfirmDialog;
