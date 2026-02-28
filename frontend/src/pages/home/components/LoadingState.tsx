import { Skeleton } from '@/components/ui/skeleton.tsx';

export function LoadingState() {
    return (
        <div className="flex flex-row gap-4 overflow-x-auto pb-4">
            {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="min-w-[16rem] h-[180px] rounded-xl" />
            ))}
        </div>
    );
}
