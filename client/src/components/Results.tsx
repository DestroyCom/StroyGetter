import { useSelector } from "react-redux";

import PlaceholderResults from "./PlaceholderResults";
import DataResults from "./DataResults";

const Results = () => {
  const qualityList = useSelector((state: any) => state.infos.qualityList);
  const name = useSelector((state: any) => state.infos.name);
  const thumbnailUrl = useSelector((state: any) => state.infos.thumbnailUrl);
  const channelName = useSelector((state: any) => state.infos.channelName);

  return (
    <>
      {qualityList && name && thumbnailUrl ? (
        <DataResults
          qualityList={qualityList}
          name={name}
          thumbnailUrl={thumbnailUrl}
          channelName={channelName}
        />
      ) : (
        <PlaceholderResults name={name} />
      )}
    </>
  );
};

export default Results;
