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
      <input
        type="text"
        placeholder="Enter video url"
        id="video-url"
        name="video-url"
        className="my-4 block w-full rounded-full border border-[#081721] bg-[#081721] p-2.5 text-white focus:border-blue-500 focus:ring-blue-500"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
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
