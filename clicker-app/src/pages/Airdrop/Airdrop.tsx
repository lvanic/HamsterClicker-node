import EthereumButton from "../../components/TonButton/TonButton";
import TonButton from "../../components/TonButton/TonButton";
import { BigEggSvg } from "./BigEggSvg";

export const Airdrop = () => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="text-2xl mb-6 mt-8">Airdrop any day...</div>
      <BigEggSvg />
      <div className="text-center my-4">
        Complete tasks and
        <br /> participate in the drop
      </div>
      <EthereumButton />
    </div>
  );
};
