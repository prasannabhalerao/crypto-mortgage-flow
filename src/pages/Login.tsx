
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import LoginForm from "@/components/auth/LoginForm";

const Login: React.FC = () => {
  return (
    <MainLayout>
      <div className="max-w-md mx-auto my-8">
        <LoginForm />
      </div>
    </MainLayout>
  );
};

export default Login;
