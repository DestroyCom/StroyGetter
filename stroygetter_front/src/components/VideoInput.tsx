import { ClipboardCopy } from 'lucide-react';

export const VideoInput = ({
  url,
  isFetching,
  setUrl,
  refetch,
}: {
  url: string;
  isFetching: boolean;
  // eslint-disable-next-line no-unused-vars
  setUrl: (url: string) => void;
  refetch: () => void;
}) => {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        refetch();
        return;
      }}
      className="mx-4 flex flex-col justify-center md:mx-auto md:w-4/6"
    >
      <div className="relative my-4 w-full">
        <input
          type="text"
          placeholder="Enter video url"
          id="video-url"
          name="video-url"
          className="block w-full rounded-full border border-[#081721] bg-[#081721] p-2.5 text-white focus:border-blue-500 focus:ring-blue-500"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex  items-center overflow-hidden rounded-r-full bg-secondary  pl-2 pr-3.5"
          title="Copy from clipboard"
          onClick={() => {
            navigator.clipboard.readText().then((clipText) => {
              setUrl(clipText);
              setTimeout(() => {
                refetch();
              }, 200);
            });
          }}
        >
          <ClipboardCopy size={24} />
        </button>
      </div>
      <button
        type="submit"
        className="border-1 m-auto mx-auto rounded-full border border-solid border-transparent bg-[#205D83] px-5 py-2.5 text-center text-lg font-medium text-white transition-all duration-200 ease-in-out hover:cursor-pointer hover:border-[#205D83] hover:bg-[#102F42] hover:ring-[#205D83] focus:outline-none focus:ring-2 focus:ring-blue-300 sm:w-auto"
        disabled={isFetching}
      >
        {isFetching ? 'Loading...' : 'Search'}
      </button>
    </form>
  );
};
