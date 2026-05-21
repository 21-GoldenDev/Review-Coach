import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUpload } from "@/hooks/use-upload";
import logo from "@assets/Logo_1768734204427.jpeg";

export default function Profile() {
  const { user, refetch } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    instagram: "",
    description: "",
    specialties: [] as string[],
    profilePicture: null as File | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedImagePath, setUploadedImagePath] = useState<string | null>(null);
  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      setUploadedImagePath(response.objectPath);
    },
  });

  // Fetch coach data if user is a coach
  const { data: coachData } = useQuery({
    queryKey: ["/api/coaches", user?.name],
    queryFn: async () => {
      if (!user?.isCoach || !user?.name) return null;
      const coaches = await apiRequest("GET", "/api/coaches");
      const coachesData = await coaches.json();
      return coachesData.find((c: any) => c.name === user.name) || null;
    },
    enabled: !!user?.isCoach && !!user?.name,
  });

  // Set form data when user data loads
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name,
        instagram: user.instagram || "",
      }));
      setPreviewUrl(user.profilePicture);
    }
  }, [user]);

  // Set form data when coach data loads
  useEffect(() => {
    if (coachData) {
      setFormData(prev => ({
        ...prev,
        description: coachData.description || "",
        specialties: coachData.specialties || [],
      }));
    }
  }, [coachData]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: {
      name?: string;
      instagram?: string;
      profilePicture?: string;
      description?: string;
      specialties?: string[];
    }) => {
      const response = await apiRequest("PUT", "/api/auth/profile", data);
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      await refetch();
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
        className: "bg-green-50 border-green-200 text-green-900",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
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

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const updateData: any = {
      name: formData.name,
      instagram: formData.instagram || undefined,
    };

    if (uploadedImagePath) {
      updateData.profilePicture = uploadedImagePath;
    }

    if (user?.isCoach) {
      updateData.description = formData.description || undefined;
      updateData.specialties = formData.specialties.length > 0 ? formData.specialties : undefined;
    }

    updateProfileMutation.mutate(updateData);
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your profile</h1>
          <Link href="/login" className="text-[#F5C518] hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

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

        <div className="max-w-2xl w-full mx-auto">
          <h1 className="text-3xl font-extrabold text-[#202020] mb-2">Edit Profile</h1>
          <p className="text-[#666666] mb-6">
            Update your profile information and settings.
          </p>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Profile Picture */}
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1">
                Profile Picture
              </label>
              <div className="flex items-center gap-4">
                {previewUrl && (
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#F5C518]">
                    <img src={previewUrl} alt="Profile preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <label className="cursor-pointer">
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
            </div>

            {/* Name */}
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
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            {/* Instagram */}
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
                />
              </div>
            </div>

            {/* Coach-specific fields */}
            {user.isCoach && (
              <>
                <div>
                  <label className="block text-sm font-medium text-[#333333] mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#F5C518] focus:border-transparent outline-none transition-all resize-none"
                    placeholder="Tell athletes about your coaching experience, specialties, and approach..."
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#333333] mb-1">
                    Specialties
                  </label>
                  <div className="space-y-2 mt-2">
                    {["Bodybuilding (Open)", "Physique development planning", "Men's Physique", "Women's Physique", "Classic Physique"].map((specialty) => (
                      <label key={specialty} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.specialties.includes(specialty)}
                          onChange={() => handleSpecialtyToggle(specialty)}
                          className="w-4 h-4 rounded border-gray-300 text-[#F5C518] focus:ring-[#F5C518]"
                        />
                        <span className="text-sm text-[#333333]">{specialty}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Role display */}
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1">
                Role
              </label>
              <div className="px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-[#333333]">
                {user.isCoach && user.isAthlete ? "Both (Coach & Athlete)" :
                 user.isCoach ? "Coach" :
                 user.isAthlete ? "Athlete" : "User"}
              </div>
              <p className="text-sm text-gray-500 mt-1">Contact admin to change your role</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="w-full bg-[#F5C518] text-[#202020] py-3 px-4 rounded-lg font-semibold hover:bg-[#E5C518] focus:ring-2 focus:ring-[#F5C518] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
            </button>
          </form>

          {/* Navigation */}
          <div className="mt-8 text-center">
            <Link href="/" className="text-[#F5C518] hover:underline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}