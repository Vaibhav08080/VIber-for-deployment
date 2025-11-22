import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CrownIcon } from "lucide-react";
import { formatDuration, intervalToDuration } from "date-fns";
import { useAuth } from "@clerk/nextjs";

interface Props {
  points: number;
  msBeforeNext: number;
}

export const Usage = ({ points, msBeforeNext }: Props) => {
    const {has} =useAuth();
    const hasProAccess = has?.({plan:"pro"});
  return (
    <div className="rounded-t-xl bg-background border border-b-0 p-2.5">
      
      <div className="flex items-center gap-x-2">
        <div>
            <p className="text-sm">
                {points} {hasProAccess ? "" : "free"} credits remaining
            </p>
            <p className="text-xs text-muted-foreground">
                Resets in{" "}
                {formatDuration(
                  intervalToDuration({ //changes made here
                    start: new Date(),
                    end: new Date(Date.now() + msBeforeNext),
                  }),
                  {
                    // include seconds so very short durations show up,
                    // and keep minutes/hours/days/months
                    format: ["months", "days", "hours", "minutes", "seconds"],
                    // if you prefer to show only the most-significant unit, 
                    // you can use `zero: true` / custom logic, or trim the result
                  }
                )}
            </p>
        </div>
        {!hasProAccess &&(
            <Button asChild size="sm" variant="tertiary" className="ml-auto">
            <Link href="/pricing"> <CrownIcon/> Upgrade</Link>
            
        </Button>
        )}
      </div>
    </div>
  );
};
