/**
 * Wathiq API Service
 * Comprehensive service for fetching and processing Saudi commercial registration data
 */

class WathiqAPIService {
    constructor() {
        this.baseUrl = 'https://api.wathq.sa/commercial-registration';
        this.apiKey = process.env.WATHIQ_API_KEY || 'vFRBMGAv78vRdCAnbXhVJMcN6AaxLn34';
    }

    /**
     * Fetch full business information from Wathiq API
     * @param {string} crNationalNumber - The CR National Number
     * @param {string} language - Language preference (en/ar)
     * @returns {Promise<Object>} - Processed business data
     */
    async fetchBusinessData(crNationalNumber, language = 'en') {
        try {
            // Clean the CR number - remove any non-digit characters
            const cleanCRNumber = crNationalNumber.toString().replace(/\D/g, '');
            console.log(`🔍 Fetching Wathiq data for CR: ${crNationalNumber} (cleaned: ${cleanCRNumber})`);
            
            const response = await fetch(
                `${this.baseUrl}/fullinfo/${cleanCRNumber}?language=${language}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'apiKey': this.apiKey,
                    },
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Wathiq API error:', errorText);
                throw new Error(`Wathiq API error: ${response.status} - ${errorText}`);
            }

            const rawData = await response.json();
            console.log('📊 Raw Wathiq data received:', JSON.stringify(rawData, null, 2));
            
            return this.processWathiqData(rawData);
        } catch (error) {
            console.error('❌ Wathiq API request failed:', error);
            throw error;
        }
    }

    /**
     * Process and extract all available data from Wathiq API response
     * @param {Object} rawData - Raw response from Wathiq API
     * @returns {Object} - Processed and structured business data
     */
    processWathiqData(rawData) {
        console.log('🔄 Processing Wathiq data...');
        
        const processedData = {
            // Basic Information
            cr_national_number: rawData.crNationalNumber || null,
            cr_number: rawData.crNumber || null,
            trade_name: rawData.name || null,
            
            // Registration Status
            registration_status: this.extractRegistrationStatus(rawData.status),
            
            // Address Information
            address: this.extractAddress(rawData),
            city: rawData.headquarterCityName || null,
            
            // Business Activities
            sector: this.extractSector(rawData.activities),
            activities: this.extractActivities(rawData.activities),
            
            // Capital Information
            cr_capital: this.extractCapital(rawData.crCapital),
            cash_capital: this.extractCashCapital(rawData.capital),
            in_kind_capital: this.extractInKindCapital(rawData.capital),
            avg_capital: this.calculateAverageCapital(rawData.capital),
            
            // Legal Information
            legal_form: this.extractLegalForm(rawData.entityType),
            issue_date_gregorian: rawData.issueDateGregorian || null,
            confirmation_date_gregorian: this.extractConfirmationDate(rawData.status),
            
            // E-commerce Information
            has_ecommerce: rawData.hasEcommerce || false,
            store_url: this.extractStoreUrl(rawData.eCommerce),
            
            // Management Information
            management_structure: this.extractManagementStructure(rawData.management),
            management_managers: this.extractManagementManagers(rawData.management),
            
            // Contact Information
            contact_info: this.extractContactInfo(rawData.contactInfo),
            
            // Verification Information
            is_verified: true, // Data from Wathiq is verified
            verification_date: new Date().toISOString(),
            
            // Additional Information
            admin_notes: this.generateAdminNotes(rawData),
            
            // Raw data for debugging
            raw_wathiq_data: rawData
        };

        console.log('✅ Processed Wathiq data:', processedData);
        return processedData;
    }

    /**
     * Extract registration status
     */
    extractRegistrationStatus(status) {
        if (!status) return 'unknown';
        
        const statusName = status.name?.toLowerCase();
        const statusCode = status.code;
        
        // Map status codes to readable names
        const statusMap = {
            '1': 'active',
            '2': 'suspended',
            '3': 'cancelled',
            '4': 'liquidated',
            '5': 'merged',
            '6': 'transformed'
        };
        
        return statusMap[statusCode] || statusName || 'unknown';
    }

    /**
     * Extract address information
     */
    extractAddress(data) {
        const parts = [];
        
        if (data.headquarterCityName) parts.push(data.headquarterCityName);
        if (data.headquarterDistrictName) parts.push(data.headquarterDistrictName);
        if (data.headquarterStreetName) parts.push(data.headquarterStreetName);
        if (data.headquarterBuildingNumber) parts.push(data.headquarterBuildingNumber);
        
        return parts.length > 0 ? parts.join(', ') : null;
    }

    /**
     * Extract sector information
     */
    extractSector(activities) {
        if (!activities || !Array.isArray(activities)) return null;
        
        const sectors = activities.map(activity => {
            if (typeof activity === 'string') return activity;
            return activity.name || activity.activityName || activity.sectorName;
        }).filter(Boolean);
        
        return sectors.length > 0 ? sectors.join(', ') : null;
    }

    /**
     * Extract activities as array
     */
    extractActivities(activities) {
        if (!activities || !Array.isArray(activities)) return [];
        
        return activities.map(activity => {
            if (typeof activity === 'string') return activity;
            return activity.name || activity.activityName || activity.sectorName;
        }).filter(Boolean);
    }

    /**
     * Extract capital information
     */
    extractCapital(crCapital) {
        if (!crCapital) return null;
        
        // Handle different formats
        if (typeof crCapital === 'number') return crCapital;
        if (typeof crCapital === 'string') {
            const parsed = parseFloat(crCapital.replace(/[^\d.]/g, ''));
            return isNaN(parsed) ? null : parsed;
        }
        
        return null;
    }

    /**
     * Extract cash capital
     */
    extractCashCapital(capital) {
        if (!capital || !capital.stockCapital) return null;
        
        const cashCapital = capital.stockCapital.cashCapital;
        if (typeof cashCapital === 'number') return cashCapital;
        if (typeof cashCapital === 'string') {
            const parsed = parseFloat(cashCapital.replace(/[^\d.]/g, ''));
            return isNaN(parsed) ? null : parsed;
        }
        
        return null;
    }

    /**
     * Extract in-kind capital
     */
    extractInKindCapital(capital) {
        if (!capital || !capital.stockCapital) return null;
        
        const inKindCapital = capital.stockCapital.inKindCapital;
        if (typeof inKindCapital === 'number') return inKindCapital.toString();
        if (typeof inKindCapital === 'string') return inKindCapital;
        
        return null;
    }

    /**
     * Calculate average capital
     */
    calculateAverageCapital(capital) {
        if (!capital || !capital.stockCapital) return null;
        
        const cashCapital = this.extractCashCapital(capital);
        const inKindCapital = this.extractInKindCapital(capital);
        
        if (cashCapital && inKindCapital) {
            const inKindNumeric = parseFloat(inKindCapital.replace(/[^\d.]/g, ''));
            return cashCapital + (isNaN(inKindNumeric) ? 0 : inKindNumeric);
        }
        
        return cashCapital || null;
    }

    /**
     * Extract legal form
     */
    extractLegalForm(entityType) {
        if (!entityType) return null;
        
        return entityType.formName || entityType.name || entityType.type || null;
    }

    /**
     * Extract confirmation date
     */
    extractConfirmationDate(status) {
        if (!status || !status.confirmationDate) return null;
        
        return status.confirmationDate.gregorian || status.confirmationDate || null;
    }

    /**
     * Extract store URL
     */
    extractStoreUrl(eCommerce) {
        if (!eCommerce || !eCommerce.eStore || !Array.isArray(eCommerce.eStore)) return null;
        
        const store = eCommerce.eStore[0];
        return store?.storeUrl || store?.url || null;
    }

    /**
     * Extract management structure
     */
    extractManagementStructure(management) {
        if (!management) return null;
        
        return management.structureName || management.structure || management.type || null;
    }

    /**
     * Extract management managers
     */
    extractManagementManagers(management) {
        if (!management || !management.managers || !Array.isArray(management.managers)) return [];
        
        return management.managers.map(manager => {
            if (typeof manager === 'string') return manager;
            return manager.name || manager.fullName || manager.managerName;
        }).filter(Boolean);
    }

    /**
     * Extract contact information
     */
    extractContactInfo(contactInfo) {
        if (!contactInfo) return null;
        
        const processed = {};
        
        if (contactInfo.phone) processed.phone = contactInfo.phone;
        if (contactInfo.email) processed.email = contactInfo.email;
        if (contactInfo.website) processed.website = contactInfo.website;
        if (contactInfo.fax) processed.fax = contactInfo.fax;
        if (contactInfo.address) processed.address = contactInfo.address;
        
        return Object.keys(processed).length > 0 ? processed : null;
    }

    /**
     * Generate admin notes from Wathiq data
     */
    generateAdminNotes(rawData) {
        const notes = [];
        
        if (rawData.status?.name) {
            notes.push(`Registration Status: ${rawData.status.name}`);
        }
        
        if (rawData.entityType?.formName) {
            notes.push(`Legal Form: ${rawData.entityType.formName}`);
        }
        
        if (rawData.issueDateGregorian) {
            notes.push(`Issue Date: ${rawData.issueDateGregorian}`);
        }
        
        if (rawData.hasEcommerce) {
            notes.push('Has E-commerce Activities: Yes');
        }
        
        if (rawData.management?.managers?.length > 0) {
            notes.push(`Management Team: ${rawData.management.managers.length} members`);
        }
        
        return notes.length > 0 ? notes.join(' | ') : null;
    }

    /**
     * Validate CR National Number format
     */
    validateCRNumber(crNumber) {
        if (!crNumber) return false;
        
        // Saudi CR numbers are typically 10 digits
        const crRegex = /^\d{10}$/;
        return crRegex.test(crNumber.toString());
    }

    /**
     * Get API health status
     */
    async checkAPIHealth() {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'apiKey': this.apiKey,
                },
            });
            
            return response.ok;
        } catch (error) {
            console.error('Wathiq API health check failed:', error);
            return false;
        }
    }
}

export default new WathiqAPIService();
