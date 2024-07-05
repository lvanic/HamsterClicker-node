import React, { useLayoutEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { AdminLayout } from "./AdminLayout";

interface ProtectedRouteProps {
  password?: string;
}

export const AdminRoute: React.FC<ProtectedRouteProps> = ({ password }) => {
  const navigate = useNavigate();

  useLayoutEffect(() => {
    let storedPassword = localStorage.getItem("password");
    if (!storedPassword) {
      storedPassword = prompt("Enter the password");
      if (storedPassword) {
        localStorage.setItem("password", storedPassword);
      } else {
        navigate("/");
      }
    }

    if (storedPassword === password) {
    } else {
      navigate("/");
    }
  }, [navigate, password]);

  return <AdminLayout><Outlet /></AdminLayout>;
};

