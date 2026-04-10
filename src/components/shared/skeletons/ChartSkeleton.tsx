import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  height?: number;
}

export function ChartSkeleton({ height = 300 }: Props) {
  return <Skeleton className="w-full rounded-lg" style={{ height }} />;
}
