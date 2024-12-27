import { Skeleton } from "../ui/skeleton";

export const SkeletonInput = () => {
  return (
    <form className="mx-4 flex flex-col justify-center md:mx-auto md:w-4/6">
      <div className="relative my-4 w-full">
        <Skeleton className="w-full bg-black/60 h-[3em] rounded-full" />
      </div>
      <button
        type="submit"
        disabled={true}
        className="border-1 m-auto mx-auto rounded-full border border-solid border-transparent bg-[#205D83] px-5 py-2.5 text-center text-lg font-medium text-white transition-all duration-200 ease-in-out hover:cursor-pointer hover:border-[#205D83] hover:bg-[#102F42] hover:ring-[#205D83] focus:outline-none focus:ring-2 focus:ring-blue-300 sm:w-auto disabled:opacity-50 disabled:hover:cursor-progress disabled:hover:bg-[#205D83] disabled:hover:border-[#205D83] disabled:hover:ring-[#205D83] disabled:cursor-not-allowed"
      >
        Loading
      </button>
    </form>
  );
};
