import { initSocketsLogic } from '../sockets';
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

    await socketsLogic.getUser(675977361);
    console.log(result.data);
    expect(result.data).toBeDefined();
    expect(result.topic).toBe('user');
});