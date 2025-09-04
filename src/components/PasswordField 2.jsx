import React, { useState, useRef, useEffect } from 'react';

const PasswordField = ({
    value,
    onChange,
    placeholder = "Enter password",
    className = "",
    required = false,
    disabled = false,
    showToggle = true,
    autoComplete = "new-password",
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef(null);

    // Function to trigger OS password suggestion
    const triggerPasswordSuggestion = () => {
        if (inputRef.current) {
            // Create a temporary input to trigger password suggestion
            const tempInput = document.createElement('input');
            tempInput.type = 'password';
            tempInput.autocomplete = 'new-password';
            tempInput.style.position = 'absolute';
            tempInput.style.left = '-9999px';
            tempInput.style.opacity = '0';
            
            document.body.appendChild(tempInput);
            tempInput.focus();
            
            // Remove the temporary input after a short delay
            setTimeout(() => {
                document.body.removeChild(tempInput);
                // Focus back on the original input
                inputRef.current.focus();
            }, 100);
        }
    };

    // Handle focus event
    const handleFocus = (e) => {
        setIsFocused(true);
        // Trigger password suggestion on first focus
        if (!value) {
            triggerPasswordSuggestion();
        }
        if (props.onFocus) {
            props.onFocus(e);
        }
    };

    // Handle blur event
    const handleBlur = (e) => {
        setIsFocused(false);
        if (props.onBlur) {
            props.onBlur(e);
        }
    };

    // Handle input change
    const handleChange = (e) => {
        onChange(e);
        // If user starts typing and the field was empty, trigger suggestion again
        if (e.target.value.length === 1 && !value) {
            triggerPasswordSuggestion();
        }
    };

    // Generate a secure password using browser's built-in generator
    const generateSecurePassword = () => {
        // Create a temporary input with password generation attributes
        const tempInput = document.createElement('input');
        tempInput.type = 'password';
        tempInput.autocomplete = 'new-password';
        tempInput.setAttribute('data-lpignore', 'true');
        tempInput.style.position = 'absolute';
        tempInput.style.left = '-9999px';
        tempInput.style.opacity = '0';
        
        document.body.appendChild(tempInput);
        tempInput.focus();
        
        // Try to trigger password generation
        setTimeout(() => {
            document.body.removeChild(tempInput);
            inputRef.current.focus();
        }, 200);
    };

    return (
        <div className={`relative ${className}`}>
            <div className="relative">
                <input
                    ref={inputRef}
                    type={showPassword ? "text" : "password"}
                    value={value}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    autoComplete={autoComplete}
                    data-lpignore="true"
                    className={`
                        w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                        ${isFocused ? 'border-blue-500' : 'border-gray-300'}
                        ${props.className || ''}
                    `}
                    {...props}
                />
                
                {/* Password toggle button */}
                {showToggle && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                        disabled={disabled}
                    >
                        {showPassword ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        )}
                    </button>
                )}
                
                {/* Generate password button */}
                <button
                    type="button"
                    onClick={generateSecurePassword}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600 focus:outline-none"
                    disabled={disabled}
                    title="Generate secure password"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                </button>
            </div>
            
            {/* Password strength indicator */}
            {value && (
                <div className="mt-2">
                    <PasswordStrengthIndicator password={value} />
                </div>
            )}
            
            {/* Help text */}
            {isFocused && !value && (
                <div className="mt-1 text-sm text-gray-500">
                    💡 Your browser will suggest a secure password. Click the generate button or start typing to trigger it.
                </div>
            )}
        </div>
    );
};

// Password strength indicator component
const PasswordStrengthIndicator = ({ password }) => {
    const getPasswordStrength = (password) => {
        let score = 0;
        
        // Length check
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        
        // Character variety checks
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        
        if (score <= 2) return { strength: 'weak', color: 'red', width: '25%' };
        if (score <= 3) return { strength: 'fair', color: 'orange', width: '50%' };
        if (score <= 4) return { strength: 'good', color: 'yellow', width: '75%' };
        return { strength: 'strong', color: 'green', width: '100%' };
    };

    const strength = getPasswordStrength(password);

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span>Password strength:</span>
                <span className={`font-medium text-${strength.color}-600 capitalize`}>
                    {strength.strength}
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                    className={`h-1.5 rounded-full bg-${strength.color}-500 transition-all duration-300`}
                    style={{ width: strength.width }}
                ></div>
            </div>
        </div>
    );
};

export default PasswordField;
