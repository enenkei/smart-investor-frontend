import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MessageCircleQuestionIcon } from "lucide-react";
import { MouseEvent } from "react";

const TooltipHelper = ({ className, content }: { className?: string, content: React.ReactNode }) => {
    return <Tooltip>
        <TooltipTrigger asChild>
            <Button
                variant="ghost"
                size="icon-sm"
                className={`rounded-full h-5 w-5 ${className}`}
                onClick={(e: MouseEvent) => e.stopPropagation()}
            >
                <MessageCircleQuestionIcon className="size-4" />
            </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
            {content}
        </TooltipContent>
    </Tooltip>
}

export default TooltipHelper;