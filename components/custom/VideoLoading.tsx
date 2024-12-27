import { Loader2 } from "lucide-react";

export const VideoLoading = () => {
  return (
    <section className="py-8" id="loading-search">
      <div className="mx-auto my-2 flex min-h-40 w-11/12 rounded-lg border-2 border-dashed border-[#102F42]">
        <Loader2 className="m-auto animate-spin text-primary" size={64} />
      </div>
    </section>
  );
};
