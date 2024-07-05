import React, { useEffect, useLayoutEffect } from "react";
import { Navigate, useNavigate, Outlet } from "react-router-dom";

interface OnlyPhoneProps {}

const OnlyPhone: React.FC<OnlyPhoneProps> = () => {
  const navigate = useNavigate();

  useLayoutEffect(() => {}, [navigate]);

  return <Outlet />;
};

export default OnlyPhone;
