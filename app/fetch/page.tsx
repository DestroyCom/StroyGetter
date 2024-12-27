import { GetterInput } from "@/components/custom/GetterInput";
import { SkeletonInput } from "@/components/custom/SkeletonInput";
import { VideoLoading } from "@/components/custom/VideoLoading";
import { VideoSelect } from "@/components/custom/VideoSelect";
import { CheckCircle2 } from "lucide-react";
import { Suspense } from "react";

export default async function QualityVideoSelection() {
  return (
    <>
      <div className="bg-primary py-8">
        <h2 className="mx-4 my-4 text-center text-5xl font-bold md:mx-auto md:w-1/3">
          Download any youtube video for free !
        </h2>
        <div className="mx-auto my-4 flex w-1/2 flex-col justify-center md:flex-row">
          <div className="mx-auto my-2 flex">
            <CheckCircle2 className="my-auto mr-2" size={24} />
            <p className="text-center">Unlimited downloads</p>
          </div>
          <div className="mx-auto my-2 flex">
            <CheckCircle2 className="my-auto mr-2 " size={24} />
            <p className="text-center">Ads free</p>
          </div>
        </div>
        <Suspense fallback={<SkeletonInput />}>
          <GetterInput />
        </Suspense>
      </div>
      <Suspense fallback={<VideoLoading />}>
        <VideoSelect />
      </Suspense>
    </>
  );
}
