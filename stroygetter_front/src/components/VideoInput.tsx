import clsx from 'clsx';
import { ClipboardCopy } from 'lucide-react';
import { useEffect, useState } from 'react';

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
  const [permission, setPermission] = useState(false);

  useEffect(() => {
    //navigator.clipboard.readText();

    checkPermission();
  }, []);

  const checkPermission = async () => {
    const queryOpts = { name: 'clipboard-read', allowWithoutGesture: false };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const permissionStatus = await navigator.permissions.query(queryOpts);

    if (permissionStatus.state === 'granted') {
      setPermission(true);
    } else {
      setPermission(false);
    }

    // Listen for changes to the permission state
    permissionStatus.onchange = () => {
      if (permissionStatus.state === 'granted') {
        setPermission(true);
      } else {
        setPermission(false);
      }
    };
  };

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
          id="clipboard-copy"
          className={clsx(
            'absolute inset-y-0 right-0 flex items-center overflow-hidden rounded-r-full bg-secondary pl-2 pr-3.5 transition-all',
            permission ? 'opacity-100' : 'bg-secondary/25',
            'hover:pointer-events-auto hover:cursor-pointer hover:bg-secondary/60 hover:opacity-100',
          )}
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
        id="search-button"
        className="border-1 m-auto mx-auto rounded-full border border-solid border-transparent bg-[#205D83] px-5 py-2.5 text-center text-lg font-medium text-white transition-all duration-200 ease-in-out hover:cursor-pointer hover:border-[#205D83] hover:bg-[#102F42] hover:ring-[#205D83] focus:outline-none focus:ring-2 focus:ring-blue-300 sm:w-auto"
        disabled={isFetching}
      >
        {isFetching ? 'Loading...' : 'Search'}
      </button>
    </form>
  );
};
