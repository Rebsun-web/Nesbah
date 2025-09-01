// Feature configuration for POS Financing MVP
export const features = {
  // Core features
  showPosFinancing: true,
  showPosDevices: false,
  showPaymentGateway: false,
  
  // Auction configuration
  auctionWindow: {
    posFinancing: {
      defaultHours: 48,
      minRequestedAmount: 10000, // SAR
      maxRequestedAmount: 5000000, // SAR
    }
  },
  
  // Access control
  accessControl: {
    // Routes accessible only via direct URL for testing (behind role flag)
    hiddenRoutes: {
      posDevices: '/pos-devices',
      paymentGateway: '/payment-gateway',
    },
    // Roles that can access hidden routes
    adminRoles: ['admin', 'super_admin', 'developer']
  }
}

// Helper function to check if user can access hidden features
export const canAccessHiddenFeatures = (userRole) => {
  return features.accessControl.adminRoles.includes(userRole)
}

// Helper function to check if feature is enabled
export const isFeatureEnabled = (featureName) => {
  return features[featureName] === true
}

// Helper function to get auction window configuration
export const getAuctionConfig = (productType = 'posFinancing') => {
  return features.auctionWindow[productType] || features.auctionWindow.posFinancing
}
