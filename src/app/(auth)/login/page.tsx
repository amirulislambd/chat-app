import LoginForm from '@/src/components/LoginForm';
import ThemeToggle from '@/src/components/ThemeToggle';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <LoginForm />
    </div>
  );
}
