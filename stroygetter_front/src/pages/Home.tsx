import { CheckCircle2 } from 'lucide-react';
import { VideoInput } from '../components/VideoInput';

import logo from '../assets/logo.svg';
import { VideoDisplay, VideoDisplayEmpty } from '../components/VideoDisplay';
import { axios_intcs } from '../lib/axios';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export const Home = () => {
  const [url, setUrl] = useState<string>('');

  const {
    data: videoData,
    refetch,
    isFetched,
    isFetching,
    error,
    isSuccess,
  } = useQuery({
    queryKey: ['video-data'],
    queryFn: async () => {
      if (!url || url.length === 0) setUrl('');

      const res = await axios_intcs.get('/api/get-infos', {
        params: {
          url,
        },
      });
      return res.data;
    },
    enabled: false,
    retry: false,
    retryOnMount: false,
  });

  return (
    <>
      <header className="flex justify-start bg-primary px-4 py-2">
        <img src={logo} alt="StroyGetter" className="aspect-square h-24" />
        <h1 className="my-auto ml-4 text-3xl font-bold">StroyGetter</h1>
      </header>
      <main className="">
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
          <VideoInput url={url} isFetching={isFetching} setUrl={setUrl} refetch={refetch} />
        </div>
        {isFetched && isSuccess ? (
          <VideoDisplay
            url={videoData.url}
            title={videoData.title}
            author={videoData.author}
            thumbnailUrl={videoData.thumbnail}
            formats={videoData.formats}
          />
        ) : (
          <VideoDisplayEmpty error={error} isFetching={isFetching} isFetched={isFetched} />
        )}
      </main>
    </>
  );
};
