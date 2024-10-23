import EthereumButton from "../../components/TonButton/TonButton";
import TonButton from "../../components/TonButton/TonButton";
import { getLocalization } from "../../localization/getLocalization";
import { BigEggSvg } from "./BigEggSvg";

export const Airdrop = () => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="text-2xl mb-6 mt-8">
        {getLocalization("airdropAnyDay")}
      </div>
      <BigEggSvg />
      <div className="text-center my-4">
        {getLocalization("completeTaskAndDrop")}
      </div>
      <EthereumButton />
    </div>
  );
};
