"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Terminal } from "lucide-react";
import { ApplicationLog } from "@/controllers/log-controller";
import { LogLevelBadge } from "./log-level-badge";
import { toast } from "sonner";

export interface LogDetailModalProps {
  log: ApplicationLog | null;
  onClose: () => void;
}

export function LogDetailModal({ log, onClose }: LogDetailModalProps) {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Log message copied to clipboard");
    } catch (err) {
      console.error(err);
      toast.error("Failed to copy log message");
    }
  };

  return (
    <Dialog open={log != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl rounded-none bg-card border-border shadow-2xl p-6">
        {log && (
          <div className="space-y-4">
            <DialogHeader>
              <div className="flex items-center justify-between gap-4">
                <DialogTitle className="flex items-center gap-2 text-base font-bold font-mono">
                  <Terminal className="w-4 h-4 text-primary" />
                  <span>Log #{log.id}</span>
                </DialogTitle>
                <div>
                  <LogLevelBadge level={log.level} />
                </div>
              </div>
              <DialogDescription className="text-xs font-mono text-muted-foreground flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                <span>
                  Timestamp:{" "}
                  {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss.SSS")}
                </span>
                <span>
                  Logger:{" "}
                  <strong className="text-foreground">{log.logger}</strong>
                </span>
              </DialogDescription>
            </DialogHeader>

            {/* Message Content with Copy Button */}
            <div className="relative">
              <div className="flex items-center justify-between pb-1.5 text-xs text-muted-foreground font-semibold">
                <span>Message Body:</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs gap-1.5 rounded-none hover:bg-muted"
                  onClick={() => handleCopy(log.message)}
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </Button>
              </div>

              <div className="bg-muted/40 border border-border/60 p-4 rounded-none overflow-x-auto max-h-[420px] custom-scrollbar">
                <pre className="font-mono text-xs whitespace-pre-wrap break-words text-foreground/90 select-text leading-relaxed">
                  {log.message}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-none text-xs"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default LogDetailModal;
