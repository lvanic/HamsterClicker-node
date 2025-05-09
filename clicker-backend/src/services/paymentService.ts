import { v4 as uuidv4 } from "uuid";
import { appDataSource } from "../core/database";
import { Payment, ServiceType } from "../models/payment";
import { User } from "../models/user";

export const createPayment = async (
  amountNano: number,
  serviceType: ServiceType,
  userId: number
): Promise<string> => {
  const user = await appDataSource.manager.findOneByOrFail(User, { tgId: userId });

  const payment = new Payment();
  payment.uuid = uuidv4();
  payment.amount = amountNano;
  payment.serviceType = serviceType;
  payment.completed = false;
  payment.used = false;
  payment.user = user;

  await appDataSource.manager.save(payment);
  return payment.uuid;
};


export const completePayment = async (uuid: string) => {
  await appDataSource.manager.update(Payment, { uuid }, { completed: true });
};

export const isPaymentCompleted = async (uuid: string): Promise<boolean> => {
  const payment = await appDataSource.manager.findOne(Payment, { where: { uuid } });
  return !!payment?.completed;
};

export const markPaymentUsed = async (uuid: string) => {
  await appDataSource.manager.update(Payment, { uuid }, { used: true });
};

export const isPaymentUsed = async (uuid: string): Promise<boolean> => {
  const payment = await appDataSource.manager.findOne(Payment, { where: { uuid } });
  return !!payment?.used;
};

export const getExpectedAmount = async (uuid: string): Promise<number | null> => {
  const payment = await appDataSource.manager.findOne(Payment, { where: { uuid } });
  return payment?.amount ?? null;
};

export const getServiceType = async (uuid: string): Promise<ServiceType | null> => {
  const payment = await appDataSource.manager.findOne(Payment, { where: { uuid } });
  return payment?.serviceType ?? null;
};
