import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { ShipWheelIcon, CameraIcon, LoaderIcon, Pencil, X } from 'lucide-react'
import toast from 'react-hot-toast'

const SetupBasicInfoPage = () => {
  const { authUser, setupBasicInfo, isLoading } = useAuthStore()

  const [fullName, setFullName] = useState(authUser?.fullName || '')
  const [bio, setBio] = useState(authUser?.bio || '')
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState(authUser?.profileImageUrl || '')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfileImageFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) return toast.error('Full name is required')
    if (fullName.trim().length < 3) return toast.error('Full name must be at least 3 characters')
    await setupBasicInfo(fullName, bio, profileImageFile || undefined)
  }

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl bg-base-200 shadow-xl rounded-2xl p-6 sm:p-10">
        <h1 className="text-3xl font-bold text-center mb-8">Update Your Profile</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-32 h-32">
              <div
                onClick={() => previewUrl && setIsPreviewOpen(true)}
                className="w-full h-full rounded-full overflow-hidden bg-base-300 shadow-md cursor-pointer hover:opacity-80 transition"
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-base-content/50">
                    <CameraIcon className="w-10 h-10" />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => document.getElementById('profileImageInput')?.click()}
                className="absolute bottom-1 right-1 bg-base-100 p-1.5 rounded-full shadow-lg hover:bg-base-200 transition"
              >
                <Pencil className="w-4 h-4 text-base-content" />
              </button>

              <input
                id="profileImageInput"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* Modal for image preview */}
            {isPreviewOpen && previewUrl && (
              <div
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                onClick={() => setIsPreviewOpen(false)}
              >
                <div
                  className="relative bg-base-100 rounded-lg shadow-xl max-w-sm w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="absolute top-2 right-2 bg-base-200 hover:bg-error text-base-content hover:text-white p-1.5 rounded-full shadow transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <img src={previewUrl} alt="Full Size Preview" className="w-full h-auto rounded" />
                </div>
              </div>
            )}
          </div>

          {/* Full name input */}
          <div className="form-control">
            <label className="label font-medium">
              <span className="label-text">Full Name</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input input-bordered w-full mt-2"
              placeholder="Your full name"
            />
          </div>

          {/* Bio textarea */}
          <div className="form-control">
            <label className="label font-medium">
              <span className="label-text">Bio</span>
            </label>
            <textarea
              name="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="textarea textarea-bordered w-full h-28 mt-2"
              placeholder="Tell others about yourself and your language learning goals"
            />
          </div>

          {/* Submit button */}
          <button className="btn btn-primary w-full gap-2" disabled={isLoading} type="submit">
            {!isLoading ? (
              <>
                <ShipWheelIcon className="size-5" />
                Save
              </>
            ) : (
              <>
                <LoaderIcon className="animate-spin size-5" />
                Please wait a moment...
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default SetupBasicInfoPage
