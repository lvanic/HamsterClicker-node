import { initSocketsLogic } from '../sockets';
import { mongoose } from "mongoose";
import dotenv from "dotenv";
import { User } from "../models";

beforeAll(async () => {
    dotenv.config();
    let config = process.env;
    await mongoose.connect(config.MONGO_DB);
});

test('getUserInfo returns valid user info', async () => {
    let result;
    const io = {emit: (topic, data) => {result = {topic, data}}};
    const socketsLogic = initSocketsLogic(io);

    await socketsLogic.getUser(675977361);
    console.log(result.data);
    expect(result.data).toBeDefined();
    expect(result.topic).toBe('user');
});

// test('upgradeClick works', async () => {
//     let result;
//     const io = {emit: (topic, data) => {result = {topic, data}}};
//     const socketsLogic = initSocketsLogic(io);

//     const userId = 675977361;
//     const startUserClickPower = (await User.findOne({ tgId: userId })).clickPower;
//     await socketsLogic.upgradeClick(userId);

//     expect(result.data).toBeDefined();
//     expect(result.topic).toBe('user');
//     expect((await User.findOne({ tgId: userId })).clickPower).toBe(startUserClickPower + 1);
// });