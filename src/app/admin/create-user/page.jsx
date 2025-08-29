import UserCreationForm from '@/components/UserCreationForm';

export default function CreateUserPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Create New User
                    </h1>
                    <p className="text-gray-600">
                        Create users with secure passwords using OS password suggestions
                    </p>
                </div>
                
                <UserCreationForm />
                
                {/* Additional Information */}
                <div className="mt-12 max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            About OS Password Suggestions
                        </h2>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-medium text-gray-800 mb-2">
                                    How It Works
                                </h3>
                                <ul className="text-gray-600 space-y-2">
                                    <li>• Browser detects password field with proper attributes</li>
                                    <li>• Shows a key icon when you focus on the field</li>
                                    <li>• Click the icon to generate a secure password</li>
                                    <li>• Password is automatically filled in the field</li>
                                    <li>• Browser can save the password for future use</li>
                                </ul>
                            </div>
                            
                            <div>
                                <h3 className="text-lg font-medium text-gray-800 mb-2">
                                    Browser Support
                                </h3>
                                <ul className="text-gray-600 space-y-2">
                                    <li>✅ Chrome/Edge (Chromium-based)</li>
                                    <li>✅ Firefox</li>
                                    <li>✅ Safari (macOS/iOS)</li>
                                    <li>✅ Mobile browsers</li>
                                    <li>⚠️ Some older browsers may not support</li>
                                </ul>
                            </div>
                        </div>
                        
                        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                            <h3 className="text-sm font-medium text-yellow-900 mb-2">
                                💡 Pro Tips
                            </h3>
                            <ul className="text-sm text-yellow-800 space-y-1">
                                <li>• Make sure your browser's password manager is enabled</li>
                                <li>• The suggestion works best with <code>autocomplete="new-password"</code></li>
                                <li>• You can also use the generate button (⚙️) to trigger suggestions</li>
                                <li>• Password strength indicator helps verify security</li>
                                <li>• Generated passwords are cryptographically secure</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
