import { CheckCircleIcon } from "@heroicons/react/solid";

const Infos = () => {
  return (
    <>
      <div className="text-center w-[50%] p-8 mx-auto">
        <h1 className="text-6xl font-bold m-auto">
          Download any youtube video for free !
        </h1>
      </div>

      <div className="flex flex-row justify-between w-[20%] m-auto">
        <div className="flex flex-row w-[13em]">
          <CheckCircleIcon className="h-7 w-7 text-white-500 m-auto" />
          <p className="m-auto text-lg">Unlimited downloads</p>
        </div>

        <div className="flex flex-row w-[6em]">
          <CheckCircleIcon className="h-7 w-7 text-white-500 m-auto" />
          <p className="m-auto text-lg">ads free</p>
        </div>
      </div>
    </>
  );
};

export default Infos;
