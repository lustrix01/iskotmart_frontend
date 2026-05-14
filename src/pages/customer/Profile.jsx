import { useEffect, useMemo, useState } from "react";
import { Camera, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "../../context/useAuth";

const emptyProfile = {
  firstName: "",
  lastName: "",
  displayName: "",
  email: "",
  phone: "",
  dob: "",
  gender: "OTHER",
  bio: "",
  createdOn: "",
  avatarUrl: "",
};

export default function Profile() {
  const { login } = useAuth();
  const [profile, setProfile] = useState(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const avatarSrc = useMemo(() => {
    if (profile.avatarUrl) {
      return profile.avatarUrl;
    }

    const seed = profile.email || profile.displayName || "IskoMart";
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
  }, [profile.avatarUrl, profile.displayName, profile.email]);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/profile.php", {
          method: "GET",
          credentials: "include",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Unable to load profile.");
        }

        if (isMounted) {
          setProfile({ ...emptyProfile, ...payload.profile });
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateField = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/profile.php", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(profile),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to save profile.");
      }

      setProfile({ ...emptyProfile, ...payload.profile });
      if (payload.user) {
        login(payload.user);
      }
      setSuccess("Profile information saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-[#003366]">
          Profile information
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Manage and protect your account details
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-10">
        {isLoading ? (
          <div className="py-20 text-center text-sm font-bold text-gray-400">
            Loading profile...
          </div>
        ) : (
          <>
            <div className="flex items-center gap-8 mb-12">
              <div className="relative shrink-0">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#F5F7F9] bg-gray-50 flex items-center justify-center">
                  <img
                    src={avatarSrc}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  className="absolute bottom-1 right-1 bg-[#003366] text-white p-2 rounded-full shadow-lg border-2 border-white opacity-60 cursor-not-allowed"
                  title="Profile photo upload is not enabled yet."
                  disabled
                >
                  <Camera size={14} />
                </button>
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-gray-800">
                  {profile.displayName || `${profile.firstName} ${profile.lastName}`}
                </h2>
                <p className="text-sm text-gray-400 font-medium">
                  {profile.email}
                </p>
                <p className="text-[10px] text-gray-300 font-bold tracking-wider">
                  {profile.createdOn ? `Member since ${profile.createdOn}` : ""}
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-2 rounded-md border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
                <XCircle size={16} />
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 flex items-center gap-2 rounded-md border border-green-100 bg-green-50 px-4 py-3 text-xs font-bold text-green-600">
                <CheckCircle2 size={16} />
                {success}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8"
            >
              <ProfileField
                label="First name"
                value={profile.firstName}
                onChange={(value) => updateField("firstName", value)}
                required
              />
              <ProfileField
                label="Last name"
                value={profile.lastName}
                onChange={(value) => updateField("lastName", value)}
                required
              />
              <ProfileField
                label="Display name"
                value={profile.displayName}
                onChange={(value) => updateField("displayName", value)}
              />
              <ProfileField
                label="Email address"
                value={profile.email}
                type="email"
                disabled
              />
              <ProfileField
                label="Phone number"
                value={profile.phone}
                onChange={(value) => updateField("phone", value)}
                required
              />
              <ProfileField
                label="Date of birth"
                value={profile.dob || ""}
                onChange={(value) => updateField("dob", value)}
                type="date"
                required
              />
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 tracking-wide ml-1">
                  Gender
                </label>
                <select
                  value={profile.gender || "OTHER"}
                  onChange={(event) => updateField("gender", event.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#003366] transition-all text-gray-600"
                  required
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Prefer not to say</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[11px] font-bold text-gray-500 tracking-wide ml-1">
                  Bio
                </label>
                <textarea
                  value={profile.bio || ""}
                  onChange={(event) => updateField("bio", event.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#003366] transition-all resize-none"
                />
              </div>

              <div className="md:col-span-2 pt-6 mt-4 border-t border-gray-50">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-[#FF851B] text-white px-10 py-3.5 rounded-lg font-bold text-sm hover:bg-[#E67616] shadow-lg shadow-orange-100 transition-all active:scale-95 disabled:opacity-70"
                >
                  {isSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function ProfileField({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
  required = false,
}) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-bold text-gray-500 tracking-wide ml-1">
        {label}
      </label>
      <input
        type={type}
        value={value || ""}
        onChange={(event) => onChange?.(event.target.value)}
        disabled={disabled}
        required={required}
        className={`w-full px-4 py-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#003366] transition-all ${
          disabled
            ? "bg-[#F8FAFC] text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-700"
        }`}
      />
    </div>
  );
}
