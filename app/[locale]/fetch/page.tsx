import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { GetterInput } from "@/components/custom/GetterInput";
import { SkeletonInput } from "@/components/custom/SkeletonInput";
import { VideoLoading } from "@/components/custom/VideoLoading";
import { VideoSelect } from "@/components/custom/VideoSelect";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("fetchTitle"),
    robots: { index: false },
  };
}

export default async function QualityVideoSelection({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <section className="bg-stroy-500 px-4 py-8 md:px-14">
      <div className="mx-auto mb-10 max-w-5xl">
        <Suspense fallback={<SkeletonInput />}>
          <GetterInput />
        </Suspense>
      </div>

      <Suspense fallback={<VideoLoading />}>
        <VideoSelect />
      </Suspense>
    </section>
  );
}
