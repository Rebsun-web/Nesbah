export function ApplicationLimit() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Column 1 content */}
        <div className="flex items-center justify-center">
          <img
            src="/characters/ApplicationLimit.png"
            className="w-full max-w-sm object-contain"
          />
        </div>

        {/* Column 2 content */}
        <div className="p-6 ">
          <h3 className="text-lg font-semibold text-gray-900">
            You have reached the limit
          </h3>
          <p className="mt-2 text-gray-600">
            There are no services available to you now until the current
            requests are completed.
          </p>
        </div>
      </div>
    </div>
  )
}