import { useSelector } from "react-redux";
import { SpinnerCircular } from "spinners-react";

import { PlaceholderProps } from "../helpers/types/types";

const PlaceholderResults = ({ name }: PlaceholderProps) => {
  const infos = useSelector((state: any) => state.errors.getInfosError);

  return (
    <div className="w-[75%] h-[20vh] border-dashed border-2 border-[#102F42] flex mx-auto my-12">
      {name === null ? (
        <p className="m-auto">{infos}</p>
      ) : (
        <SpinnerCircular color="#081721" size={100} className="m-auto" />
      )}
    </div>
  );
};

export default PlaceholderResults;
