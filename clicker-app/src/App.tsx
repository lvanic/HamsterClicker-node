import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./pages/Layout/Layout";
import { Clicker } from "./pages/Clicker/Clicker";
import { Referrals } from "./pages/Referrals/Referrals";
import { NoPage } from "./pages/NoPage/NoPage";
import { Tasks } from "./pages/Tasks/Tasks";
import { WebSocketProvider } from "./contexts/WebsocketContext";
import { getConfig } from "./utils/config";
import { getTelegramUser } from "./services/telegramService";
import Loader from "./components/Loader/Loader";
import { UserProvider } from "./contexts/UserContext";
import MaintenanceNotice from "./pages/MaintenanceNotice/MaintenanceNotice";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { useEffect } from "react";
import { Boosts } from "./pages/Boosts/Boosts";
import { LoadingProvider } from "./contexts/LoadingContext";
import {
  AdminSettings,
  AdminTasks,
  AdminUsers,
  AdminRoute,
  AddTask,
  AdminLeagues,
  AdminAddLeague,
  AdminBusinesses,
  AdminAddBusiness,
  AdminEditBusiness,
  AdminEditLeague,
  AdminEditTask,
} from "./pages/Admin";
import { LeagueTop } from "./pages/LeagueTop/LeagueTop";
import { Businesses } from "./pages/Businesses/Businesses";
import { Airdrop } from "./pages/Airdrop/Airdrop";
import { NotifyProvider } from "./contexts/NotifyContext";
import { DataProvider } from "./contexts/DataContext";
import { AdminBroadcast } from "./pages/Admin/AdminBroadcast/AdminBroadcast";

function switchSwipeDown(enable: boolean) {
  window.Telegram.WebApp.expand();
  document.body.style.overflow = enable ? "hidden" : "auto";
  document.body.style.marginTop = enable ? "100px" : "0";
  document.body.style.height = enable
    ? `${window.innerHeight + 100}px`
    : "100vh";
  window.scrollTo(0, enable ? +100 : 0);
  window.addEventListener("scroll", (e) => {
    e.preventDefault();
  });

  document.addEventListener("gesturestart", function (e) {
    e.preventDefault();
  });
}

function App() {
  const { serverUrl, adminPassword, tonManifest } = getConfig();
  const telegramUser = getTelegramUser();

  useEffect(() => {
    switchSwipeDown(true);
  }, []);
  return (
    <BrowserRouter>
      <LoadingProvider>
        <WebSocketProvider url={serverUrl} user_id={telegramUser?.id}>
          <TonConnectUIProvider manifestUrl={tonManifest}>
            <UserProvider user_id={telegramUser.id}>
              <DataProvider>
                <NotifyProvider>
                  <Routes>
                    <Route
                      path="/"
                      loader={() => <Loader />}
                      element={<Layout />}
                    >
                      <Route index element={<Clicker />} />
                      <Route path="referrals" element={<Referrals />} />
                      <Route path="tasks" element={<Tasks />} />
                      <Route path="boosts" element={<Boosts />} />
                      <Route path="league" element={<LeagueTop />} />
                      <Route path="businesses" element={<Businesses />} />
                      <Route path="airdrop" element={<Airdrop />} />
                      <Route
                        path="maintenance-notice"
                        element={<MaintenanceNotice />}
                      />
                    </Route>
                    <Route
                      path="/admin"
                      element={<AdminRoute password={adminPassword} />}
                    >
                      <Route index element={<AdminSettings />} />
                      <Route path="tasks" element={<AdminTasks />} />
                      <Route path="tasks/add" element={<AddTask />} />
                      <Route
                        path="tasks/edit/:id"
                        element={<AdminEditTask />}
                      />
                      <Route path="leagues" element={<AdminLeagues />} />
                      <Route path="leagues/add" element={<AdminAddLeague />} />
                      <Route
                        path="leagues/edit/:id"
                        element={<AdminEditLeague />}
                      />
                      <Route path="businesses" element={<AdminBusinesses />} />
                      <Route
                        path="businesses/add"
                        element={<AdminAddBusiness />}
                      />
                      <Route
                        path="businesses/edit/:id"
                        element={<AdminEditBusiness />}
                      />
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="settings" element={<AdminSettings />} />
                      <Route path="broadcast" element={<AdminBroadcast />} />
                    </Route>
                    <Route path="*" element={<NoPage />} />
                  </Routes>
                </NotifyProvider>
              </DataProvider>
            </UserProvider>
          </TonConnectUIProvider>
        </WebSocketProvider>
      </LoadingProvider>
    </BrowserRouter>
  );
}

export default App;
