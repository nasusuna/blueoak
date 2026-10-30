import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Sign in",
};

const LoginPage = () => (
  <main className="flex min-h-dvh items-center justify-center px-4 py-12">
    <Card className="w-full max-w-md shadow-md">
      <CardHeader className="gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">BO</span>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium tracking-wide text-primary uppercase">Blue Oak</p>
          <h1 className="text-3xl font-semibold tracking-tight">Staff sign in</h1>
          <p className="text-base text-muted-foreground">Use the email and password for your business.</p>
        </div>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  </main>
);

export default LoginPage;
