import { appDataSource } from "../core/database";
import { League } from "../models/league";

const leagueRepository = appDataSource.getRepository(League);

export const findAllLeagues = async (): Promise<League[]> => {
  const leagues = await leagueRepository.find();

  return leagues;
};

export const findLeagueById = (leagueId: number): Promise<League | null> => {
  return leagueRepository.findOneBy({
    id: leagueId,
  })
};
