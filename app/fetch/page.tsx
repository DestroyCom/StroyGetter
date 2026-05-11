import { Suspense } from "react";
import { GetterInput } from "@/components/custom/GetterInput";
import { SkeletonInput } from "@/components/custom/SkeletonInput";
import { VideoLoading } from "@/components/custom/VideoLoading";
import { VideoSelect } from "@/components/custom/VideoSelect";

export const metadata = {
  title: "Download video",
  robots: { index: false },
};

export default function QualityVideoSelection() {
  return (
    <section className="bg-stroy-500 px-4 py-8 md:px-14">
      {/* URL recap / edit bar */}
      <div className="mx-auto mb-10 max-w-5xl">
        <Suspense fallback={<SkeletonInput />}>
          <GetterInput />
        </Suspense>
      </div>

      {/* Result card + format picker */}
      <Suspense fallback={<VideoLoading />}>
        <VideoSelect />
      </Suspense>
    </section>
  );
}
