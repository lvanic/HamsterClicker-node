import { initSocketsLogic } from '../src/socket/socket.js';
import { mongoose } from "mongoose";
import dotenv from "dotenv";

beforeAll(async () => {
    dotenv.config();
    let config = process.env;
    await mongoose.connect(config.MONGO_DB);
});

test('getUserInfo returns valid user info', async () => {
    let result;
    const io = {emit: (topic, data) => {result = {topic, data}}};
    const socketsLogic = initSocketsLogic(io);

    await socketsLogic.getUser(571484499);
    console.log(result.data);
    expect(result.data).toBeDefined();
    expect(result.topic).toBe('user');
});

test('upgrade business works', async () => {
    let result;
    const io = {emit: (topic, data) => {result = {topic, data}}};
    const socketsLogic = initSocketsLogic(io);

    await socketsLogic.upgradeBusiness(571484499, '6697fbfbb11a70c448080b35');

    expect(result.data).toBeDefined();
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