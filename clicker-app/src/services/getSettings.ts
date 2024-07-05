import { useEffect, useState } from "react";
import { getConfig } from "../utils/config";

interface Settings {}

const { adminApiUrl } = getConfig();

export const getSettings = async () => {
  const response = await fetch(`${adminApiUrl}/admin/settings`);
  const settings = await response.json();

  return settings;
};
