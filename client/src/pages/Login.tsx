import { useState } from "react";
import { Link, useLocation } from "wouter";
import logo from "@assets/Logo_1768734204427.jpeg";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function Login() {
  const { toast } = useToast();
  const { login } = useAuth();
  const [, navigate] = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const user = await login(email, password);
      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.name}`,
      });
      navigate("/");
    } catch (err: any) {
      const message = err?.message || "Invalid email or password";
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group justify-center">
              <div className="w-10 h-10 rounded bg-[#202020] p-0.5 overflow-hidden">
                <img src={logo} alt="Logo" className="w-full h-full object-cover rounded" />
              </div>
              <span className="font-bold text-xl text-[#202020] group-hover:text-[#F5C518] transition-colors">
                Rate My Coach
              </span>
            </div>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-[#202020] mb-2">Welcome back</h1>
          <p className="text-[#666666]">Please enter your details to sign in.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-[#333333] mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => handleInputChange("email", e.target.value.toLowerCase())}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#F5C518] focus:border-transparent outline-none transition-all"
              placeholder="name@example.com"
              data-testid="input-email"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#333333] mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#F5C518] focus:border-transparent outline-none transition-all"
              placeholder="Enter your password"
              data-testid="input-password"
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary-yellow py-3.5 rounded-lg font-bold text-base shadow-lg shadow-yellow-500/20 mt-2 disabled:opacity-50"
            data-testid="button-login"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-[#666666]">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="text-[#F5C518] font-bold hover:underline"
            data-testid="link-register"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
