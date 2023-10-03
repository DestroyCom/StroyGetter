import { CheckCheck, Download, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axios_intcs } from '../lib/axios';
import clsx from 'clsx';

export const VideoDisplay = ({
  url,
  title,
  author,
  thumbnailUrl,
  formats,
}: {
  url: string;
  title: string;
  author: string;
  thumbnailUrl: string;
  formats: {
    qualityLabel: string;
    itag: string;
  }[];
}) => {
  const [chooseFormat, setChooseFormat] = useState('best');

  const getVideo = useQuery({
    queryKey: ['getVideo', url, chooseFormat],
    queryFn: async () => {
      let itag = chooseFormat;
      let quality = formats.find((format) => format.itag === itag)?.qualityLabel || '';
      if (chooseFormat === 'best') {
        itag = formats[0].itag;
        quality = formats[0].qualityLabel;
      }

      if (chooseFormat === 'music') {
        itag = 'music';
        quality = 'music';
      }

      const res = await axios_intcs.get('/api/download', {
        params: {
          url,
          itag,
          quality,
        },
        responseType: 'blob',
      });

      if (!res.data) throw new Error('Error while converting the file');

      const contentType = res.headers['content-type'];
      const urlDownload = window.URL.createObjectURL(new Blob([res.data], { type: contentType }));
      const link = document.createElement('a');
      link.href = urlDownload;
      link.download = `${title} - ${author} - ${quality}`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      return res.data;
    },
    enabled: false,
    retry: false,
    retryOnMount: false,
  });

  useEffect(() => {
    formats.sort((a, b) => {
      const aSplit = a.qualityLabel.split('p');
      const bSplit = b.qualityLabel.split('p');
      return Number(bSplit[0]) - Number(aSplit[0]);
    });
  }, [formats]);

  return (
    <section className="py-8">
      <div className="mx-auto my-2 flex h-auto w-11/12 rounded-lg border-2 border-dashed border-primary py-2 md:py-4 lg:text-xl">
        <img
          src={thumbnailUrl}
          title={`Thumbnail of ${title}`}
          className="m-auto aspect-video w-3/12 rounded-lg"
          alt={`Thumbnail of ${title}`}
        />
        <div className="my-auto flex w-8/12 flex-col">
          <h3 className="line-clamp-2">
            {title} <span className="font-light italic">by {author}</span>
          </h3>
          <div className="mx-2 flex flex-col justify-end md:my-2 md:flex-row">
            <Select
              defaultValue="best"
              onValueChange={(value) => {
                setChooseFormat(value);
              }}
              value={chooseFormat}
              disabled={getVideo.isFetching}
            >
              <SelectTrigger className="my-0.5 w-full border-primary bg-secondary text-white outline-primary md:mx-2 md:h-auto">
                <SelectValue placeholder="Quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="best">Best quality</SelectItem>
                {formats &&
                  formats.map((format) => (
                    <SelectItem key={format.qualityLabel} value={format.itag}>
                      {format.qualityLabel}
                    </SelectItem>
                  ))}
                <SelectItem value="music">Music</SelectItem>
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                getVideo.refetch();
              }}
              disabled={getVideo.isFetching}
              className={clsx(
                'flex w-full flex-row justify-center rounded-lg border-2 border-transparent bg-[#102F42] px-4 py-2 text-center font-bold text-white transition-all ease-in-out',
                'md:mx-2',
                !getVideo.isFetching && 'hover:cursor-pointer hover:border-primary hover:bg-secondary',
                getVideo.isFetching && 'opacity-50',
              )}
            >
              {!getVideo.isFetching && getVideo.isSuccess && (
                <>
                  Downloaded <CheckCheck className="ml-2" size={24} />
                </>
              )}
              {getVideo.isFetching && (
                <>
                  Download
                  <Loader2 className="ml-2 animate-spin" size={24} />
                </>
              )}
              {!getVideo.isFetching && !getVideo.isSuccess && (
                <>
                  Download <Download className="ml-2" size={24} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        getVideo && getVideo.error && getVideo.error.response && (
          <p className="m-auto mx-auto text-center font-bold text-red-500 md:text-xl">
            {/* // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                //@ts-ignore */}
            {getVideo.error.response.data}
          </p>
        )
      }
      <p className="text-center text-sm font-extralight italic opacity-80 md:text-base md:font-light">
        Conversion may take some time. <br />
        Please be patient and do not reload the page.
      </p>
    </section>
  );
};

export const VideoDisplayEmpty = ({
  error,
  isFetching,
  isFetched,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any;
  isFetching: boolean;
  isFetched: boolean;
}) => {
  return (
    <section className="py-8">
      <div className="mx-auto my-2 flex h-auto w-11/12 rounded-lg border-2 border-dashed border-[#102F42]">
        {isFetched && error && !isFetching && (
          <p className="m-auto mx-auto my-10 text-center font-bold text-red-500 md:my-24 md:text-xl">
            {error.response.data.message}
          </p>
        )}
        {isFetching && <Loader2 className="m-auto my-10 animate-spin text-primary md:my-24" size={64} />}
        {!isFetched && !isFetching && <p className="mx-auto my-10 md:my-24">Please search a video first !</p>}
      </div>
    </section>
  );
};
