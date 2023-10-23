import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { CheckCircle2, Github } from 'lucide-react';

import { axios_intcs } from '../lib/axios';
import { checkMobile } from '../lib/utils';

import { toast } from '../components/ui/use-toast';
import { ToastAction } from '../components/ui/toast';
import { Separator } from '../components/ui/separator';

import { VideoInput } from '../components/VideoInput';
import { VideoDisplay, VideoDisplayEmpty } from '../components/VideoDisplay';

import logo from '../assets/logo.svg';

export const Home = () => {
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlParam = urlParams.get('search');
    if (urlParam) {
      setUrl(urlParam);
      setTimeout(() => {
        refetch();
      }, 200);
    }
  }, []);

  useEffect(() => {
    if (checkMobile()) return;

    setTimeout(() => {
      toast({
        title: 'A new StroyGetter extension is available !',
        description: 'Working on Chrome, Edge, Brave, Opera, ...',
        action: (
          <ToastAction altText="Get the extension !">
            <a
              href="https://github.com/DestroyCom/StroyGetter#the-stroygetter-extension"
              target="_blank"
              rel="noreferrer"
            >
              Get the extension !
            </a>
          </ToastAction>
        ),
      });
    }, 2000);
  }, []);

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
      <header className="flex justify-between bg-primary px-4 py-2">
        <div className="flex justify-start">
          <img src={logo} alt="StroyGetter" className="aspect-square h-24" />
          <h1 className="my-auto ml-4 text-3xl font-bold">StroyGetter</h1>
        </div>
        <div className="hidden flex-col md:flex">
          <a
            className="flex transition-all hover:opacity-50"
            href="https://github.com/DestroyCom/StroyGetter"
            target="_blank"
            rel="noreferrer"
          >
            <Github className="mr-4" /> <p className="underline">The project code</p>
          </a>
        </div>
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
        <section id="faq" className="mx-auto mt-4 w-11/12">
          <h3 className="w-11/12 text-2xl font-bold">FAQ</h3>
          <div className="flex flex-col lg:flex-row lg:justify-between">
            <div className="w-full lg:w-1/2">
              <h2 className="my-2 text-xl">What is StroyGetter ?</h2>
              <p>
                StroyGetter is a{' '}
                <a href="https://www.youtube.com/" target="_blank" rel="noreferrer">
                  Youtube
                </a>{' '}
                downloader, so you can download almost any video <span className="italic">(of your own)</span> in any
                available quality.
                <br />
                Audio-only conversion is also available.
              </p>
            </div>
            <Separator orientation="vertical" className="mx-4 hidden h-40 w-0.5 bg-primary/50 lg:block" />
            <Separator className="my-4 h-0.5 w-full bg-primary/50 lg:hidden" />
            <div className="w-full lg:w-1/2">
              <h2 className="my-2 text-xl">Why use StroyGetter and not another alternative?</h2>
              <p>
                StroyGetter is totally free and requires no software download to achieve maximum video quality.
                <br />
                What&apos;s more, StroyGetter is Open-Source, meaning that anyone can view the code or contribute to it,
                which limits any possible security loopholes.
              </p>
            </div>
          </div>
          <Separator className="my-4 h-0.5 w-full bg-primary/50" />
          <div className="flex flex-col lg:flex-row lg:justify-between">
            <div className="w-full lg:w-1/2">
              <h2 className="my-2 text-xl">Totally free, where&apos;s the catch ?</h2>
              <p>
                There&apos;s no catch, we just use statistical tools to find out how people use the site and count
                visitors, and that&apos;s it. Of course, depending on traffic, we reserve the right to add non-intrusive
                ads to finance server costs.
              </p>
            </div>
            <Separator orientation="vertical" className="mx-4 hidden h-40 w-0.5 bg-primary/50 lg:block" />
            <Separator className="my-4 h-0.5 w-full bg-primary/50 lg:hidden" />
            <div className="w-full lg:w-1/2">
              <h2 className="my-2 text-xl">The StroyGetter Extension</h2>
              <p>
                An extension is available for Chrome, Edge, Brave and Opera browsers. The extension allows quick access
                to the site from a youtube video. Due to the nature of the project, the extension cannot be installed
                from a store, and must be installed manually, as explained{' '}
                <a
                  href="https://github.com/DestroyCom/StroyGetter#the-stroygetter-extension"
                  target="_blank"
                  className="underline hover:cursor-pointer hover:opacity-50"
                  rel="noreferrer"
                >
                  here
                </a>
                .
              </p>
            </div>
          </div>
        </section>
        <footer className="mx-auto my-4 text-center">
          <a
            className="text-sm hover:cursor-pointer hover:underline hover:opacity-75"
            href="https://portfolio.stroyco.eu/"
          >
            StroyGetter - {new Date().getFullYear()}
          </a>
        </footer>
      </main>
    </>
  );
};
