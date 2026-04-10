import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  text: string;
}

export function HelpTooltip({ text }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex items-center justify-center h-5 w-5 text-muted-foreground/60 hover:text-muted-foreground transition-colors" aria-label="Help">
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="max-w-[250px] text-sm" side="top" align="start">
        {text}
      </PopoverContent>
    </Popover>
  );
}
