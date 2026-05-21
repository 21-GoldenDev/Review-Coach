import { useState } from "react";
import { Link, useLocation } from "wouter";
import logo from "@assets/Logo_1768734204427.jpeg";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUpload } from "@/hooks/use-upload";
import { useAuth } from "@/hooks/use-auth";

export default function Auth() {
  const [location, setLocation] = useLocation();
  const isRegister = location === "/register";
  const { toast } = useToast();
  const { refetch } = useAuth();

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [formData, setFormData] = useState({
    role: "" as "" | "athlete" | "coach" | "both",
    isAthlete: false,
    isCoach: false,
    name: "",
    instagram: "",
    email: "",
    description: "",
    specialties: [] as string[],
    profilePicture: null as File | null,
    password: "",
    verificationAnswer: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedImagePath, setUploadedImagePath] = useState<string | null>(null);
  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      setUploadedImagePath(response.objectPath);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      password: string;
      instagram?: string;
      profilePicture?: string;
      description?: string;
      specialties?: string[];
      isAthlete: boolean;
      isCoach: boolean;
      verificationAnswer: string;
    }) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      await refetch();
      toast({
        title: "Registration Successful",
        description: "Your account has been created! You are now signed in.",
        className: "bg-green-50 border-green-200 text-green-900",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      await refetch();
      toast({
        title: "Login Successful",
        description: "Welcome back!",
        className: "bg-green-50 border-green-200 text-green-900",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field === "role") {
      const role = value as "athlete" | "coach" | "both";
      setFormData((prev) => ({
        ...prev,
        role,
        isAthlete: role === "athlete" || role === "both",
        isCoach: role === "coach" || role === "both",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (errors.role) {
      setErrors((prev) => ({ ...prev, role: "" }));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, profilePicture: file }));
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      const result = await uploadFile(file);
      if (result) {
        setUploadedImagePath(result.objectPath);
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.role) {
      newErrors.role = "Please select a role";
    }
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!formData.verificationAnswer.trim()) {
      newErrors.verificationAnswer = "Please answer the verification question";
    } else if (formData.verificationAnswer.trim().toLowerCase() !== "derek lunsford") {
      newErrors.verificationAnswer = "Wrong answer";
    }
    if ((formData.isCoach || formData.role === "both") && !formData.description.trim()) {
      newErrors.description = "Description is required for coaches";
    }
    if ((formData.isCoach || formData.role === "both") && formData.specialties.length === 0) {
      newErrors.specialties = "Please select at least one specialty";
    }
    if ((formData.isCoach || formData.role === "both") && !uploadedImagePath) {
      newErrors.profilePicture = "Profile picture is required for coaches";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRegister) {
      if (validateForm()) {
        const isCoach = formData.role === "coach" || formData.role === "both";
        const isAthlete = formData.role === "athlete" || formData.role === "both";

        registerMutation.mutate({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          instagram: formData.instagram || undefined,
          profilePicture: uploadedImagePath || undefined,
          description: isCoach ? formData.description || undefined : undefined,
          specialties: isCoach && formData.specialties.length > 0 ? formData.specialties : undefined,
          isAthlete,
          isCoach,
          verificationAnswer: formData.verificationAnswer,
        });
      }
    } else {
      if (!loginData.email.trim() || !loginData.password.trim()) {
        toast({
          title: "Missing Fields",
          description: "Please enter your email and password.",
          variant: "destructive",
        });
        return;
      }
      loginMutation.mutate({
        email: loginData.email,
        password: loginData.password,
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12 overflow-y-auto">
        <div className="mb-8">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group w-fit">
              <div className="w-8 h-8 rounded bg-[#202020] p-0.5 overflow-hidden">
                <img src={logo} alt="Logo" className="w-full h-full object-cover rounded" />
              </div>
              <span className="font-bold text-lg text-[#202020] group-hover:text-[#F5C518] transition-colors">
                Rate My Coach
              </span>
            </div>
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto">
          <h1 className="text-3xl font-extrabold text-[#202020] mb-2">
            {isRegister ? "Create an account" : "Welcome back"}
          </h1>
          <p className="text-[#666666] mb-6">
            {isRegister
              ? "Join the community to find and review coaches."
              : "Please enter your details to sign in."}
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <div>
                  <label className="block text-sm font-medium text-[#333333] mb-2">
                    I'm a: <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer" data-testid="radio-athlete">
                      <input
                        type="radio"
                        name="role"
                        value="athlete"
                        checked={formData.role === "athlete"}
                        onChange={(e) => handleInputChange("role", e.target.value)}
                        className="w-5 h-5 rounded border-gray-300 text-[#F5C518] focus:ring-[#F5C518]"
                      />
                      <span className="text-[#333333] font-medium">Athlete</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer" data-testid="radio-coach">
                      <input
                        type="radio"
                        name="role"
                        value="coach"
                        checked={formData.role === "coach"}
                        onChange={(e) => handleInputChange("role", e.target.value)}
                        className="w-5 h-5 rounded border-gray-300 text-[#F5C518] focus:ring-[#F5C518]"
                      />
                      <span className="text-[#333333] font-medium">Coach</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer" data-testid="radio-both">
                      <input
                        type="radio"
                        name="role"
                        value="both"
                        checked={formData.role === "both"}
                        onChange={(e) => handleInputChange("role", e.target.value)}
                        className="w-5 h-5 rounded border-gray-300 text-[#F5C518] focus:ring-[#F5C518]"
                      />
                      <span className="text-[#333333] font-medium">Both</span>
                    </label>
                  </div>
                  {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#333333] mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#F5C518] focus:border-transparent outline-none transition-all"
                    placeholder="Your full name"
                    data-testid="input-name"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#333333] mb-1">
                    Instagram
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">@</span>
                    <input
                      type="text"
                      value={formData.instagram}
                      onChange={(e) => handleInputChange("instagram", e.target.value.replace(/^@/, ''))}
                      className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#F5C518] focus:border-transparent outline-none transition-all"
                      placeholder="username"
                      data-testid="input-instagram"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={isRegister ? formData.email : loginData.email}
                onChange={(e) => isRegister ? handleInputChange("email", e.target.value.toLowerCase()) : setLoginData(prev => ({ ...prev, email: e.target.value.toLowerCase() }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#F5C518] focus:border-transparent outline-none transition-all"
                placeholder="name@example.com"
                data-testid="input-email"
              />
              {isRegister && errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {isRegister && (formData.role === "coach" || formData.role === "both") && (
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#F5C518] focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Tell athletes about your coaching experience, specialties, and approach..."
                  rows={4}
                  data-testid="input-description"
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>
            )}

            {isRegister && (formData.role === "coach" || formData.role === "both") && (
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-1">
                  Specialties <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2 mt-2">
                  {["Bodybuilding (Open)", "Gen Pop", "Men's Physique", "Women's Physique", "Classic Physique", "Bikini", "Wellness", "Figure", "Womens BB"].map((specialty) => (
                    <label key={specialty} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.specialties.includes(specialty)}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...formData.specialties, specialty]
                            : formData.specialties.filter((s) => s !== specialty);
                          setFormData({ ...formData, specialties: updated });
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-[#F5C518] focus:ring-[#F5C518]"
                        data-testid={`checkbox-specialty-${specialty.toLowerCase().replace(/\s+/g, "-").replace(/[()]/g, "")}`}
                      />
                      <span className="text-sm text-[#333333]">{specialty}</span>
                    </label>
                  ))}
                </div>
                {errors.specialties && <p className="text-red-500 text-sm mt-1">{errors.specialties}</p>}
              </div>
            )}

            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-1">
                  Profile Picture {(formData.role === "coach" || formData.role === "both") && <span className="text-red-500">*</span>}
                </label>
                <div className="flex items-center gap-4">
                  {previewUrl && (
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#F5C518]">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <label className="cursor-pointer" data-testid="input-profile-picture">
                    <div className="px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-[#333333]">
                      {isUploading ? "Uploading..." : previewUrl ? "Change Photo" : "Upload Photo"}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                </div>
                {errors.profilePicture && <p className="text-red-500 text-sm mt-1">{errors.profilePicture}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={isRegister ? formData.password : loginData.password}
                onChange={(e) => isRegister ? handleInputChange("password", e.target.value) : setLoginData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#F5C518] focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                data-testid="input-password"
              />
              {isRegister && errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-1">
                  Verification Question <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-[#666666] mb-2">Who won the Mr Olympia this year?</p>
                <input
                  type="text"
                  value={formData.verificationAnswer}
                  onChange={(e) => handleInputChange("verificationAnswer", e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#F5C518] focus:border-transparent outline-none transition-all"
                  placeholder="Your answer"
                  data-testid="input-verification"
                />
                {errors.verificationAnswer && (
                  <p className="text-red-500 text-sm mt-1">{errors.verificationAnswer}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={registerMutation.isPending || loginMutation.isPending || isUploading}
              className="w-full btn-primary-yellow py-3.5 rounded-lg font-bold text-base shadow-lg shadow-yellow-500/20 mt-4 disabled:opacity-60"
              data-testid="button-submit"
            >
              {registerMutation.isPending ? "Creating Account..." : loginMutation.isPending ? "Signing In..." : isUploading ? "Uploading Image..." : isRegister ? "Create Account" : "Sign In"}
            </button>

            {!isRegister && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-[#333333] py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  data-testid="button-google"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </button>
              </>
            )}
          </form>

          <p className="text-center mt-6 text-sm text-[#666666]">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <Link
              href={isRegister ? "/login" : "/register"}
              className="text-[#F5C518] font-bold hover:underline"
              data-testid="link-toggle-auth"
            >
              {isRegister ? "Sign in" : "Sign up"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
