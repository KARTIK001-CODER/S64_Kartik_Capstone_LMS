import React from 'react'

const Loading = ({ fullScreen = false }) => {
  return (
    <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'py-20'}`}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Loading...</p>
      </div>
    </div>
  )
}

export default Loading
