import { getWorks } from "@/lib/microcms";
import GalleryShell from "@/components/GalleryShell";
import SubmitButton from "@/components/SubmitButton";

// ISR: 1時間ごとにキャッシュを更新する
export const revalidate = 3600;

export default async function Home() {
  const works = await getWorks();

  return (
    <>
      <SubmitButton />
      <GalleryShell works={works} />
    </>
  );
}
