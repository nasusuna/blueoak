import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Sign in",
};

const LoginPage = () => (
  <main className="flex min-h-dvh items-center justify-center px-4 py-10">
    <Card className="w-full max-w-md">
      <CardHeader>
        <p className="text-base font-medium text-primary">Service App</p>
        <h1 className="text-2xl font-semibold tracking-tight">Staff sign in</h1>
        <p className="text-base text-muted-foreground">Use the email and password for your business.</p>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  </main>
);

export default LoginPage;
