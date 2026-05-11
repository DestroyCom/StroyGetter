import { Loader2 } from "lucide-react";

export const VideoLoading = () => {
  return (
    <section className="px-4 py-10 mb-32" id="loading-search">
      <div className="mx-auto flex min-h-64 w-full max-w-5xl items-center justify-center rounded-2xl border-2 border-dashed border-stroy-800">
        <Loader2 className="animate-spin text-stroy-300" size={48} />
      </div>
    </section>
  );
};
