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
        console.log('🔍 Raw Wathiq data structure:', {
            hasCapital: !!rawData.capital,
            capitalKeys: rawData.capital ? Object.keys(rawData.capital) : null,
            hasECommerce: !!rawData.eCommerce,
            eCommerceKeys: rawData.eCommerce ? Object.keys(rawData.eCommerce) : null,
            hasManagement: !!rawData.management,
            managementKeys: rawData.management ? Object.keys(rawData.management) : null,
            hasContactInfo: !!rawData.contactInfo,
            contactInfoKeys: rawData.contactInfo ? Object.keys(rawData.contactInfo) : null
        });
        
        const processedData = {
            // 1.1 Required Data Fields from Wathiq API (as per specification)
            
            // Basic CR Information
            cr_number: rawData.crNumber || null,                                    // Commercial Registration Number
            cr_national_number: rawData.crNationalNumber || null,                   // CR National Number
            trade_name: rawData.name || null,                                       // Business Name
            
            // Legal and Status Information
            legal_form: this.extractLegalForm(rawData.entityType),                 // entityType.formName - Legal Form
            registration_status: this.extractRegistrationStatus(rawData.status),    // status.name - CR Status
            city: rawData.headquarterCityName || null,                              // headquarterCityName - City
            issue_date_gregorian: rawData.issueDateGregorian || null,              // issueDateGregorian - CR Issue Date
            confirmation_date_gregorian: this.extractConfirmationDate(rawData.status), // confirmationDate.gregorian - Confirmation Date
            
            // Contact Information
            contact_info: this.extractContactInfo(rawData.contactInfo),            // contactInfo (email, mobile, phone)
            
            // Business Activities
            activities: this.extractActivities(rawData.activities),                 // activities[] - Business Activities Array
            
            // E-commerce Information
            has_ecommerce: rawData.hasEcommerce || false,                          // hasEcommerce - E-commerce Flag
            store_url: this.extractStoreUrl(rawData.eCommerce),                    // eCommerce.eStore[0].storeUrl - Store URL
            
            // Capital Information
            cr_capital: this.extractCapital(rawData.crCapital),                    // crCapital - CR Capital
            cash_capital: this.extractCashCapital(rawData.capital),                // capital.contributionCapital.cashCapital - Cash Capital
            
            // Management Information
            management_structure: this.extractManagementStructure(rawData.management), // management.structureName - Management Structure
            management_managers: this.extractManagementManagers(rawData.management),  // management.managers[].name - Manager Names
            
            // Additional Information (for completeness)
            address: this.extractAddress(rawData),                                  // Address (computed from multiple fields)
            sector: this.extractSector(rawData.activities),                         // Sector (computed from activities)
            in_kind_capital: this.extractInKindCapital(rawData.capital),           // In-kind capital
            avg_capital: this.calculateAverageCapital(rawData.capital),            // Average capital
            
            // Verification Information
            is_verified: true,                                                     // Data from Wathiq is verified
            verification_date: new Date().toISOString(),                           // Current timestamp
            
            // Additional Information
            admin_notes: this.generateAdminNotes(rawData),                         // Generated admin notes
            
            // Raw data for debugging
            raw_wathiq_data: rawData
        };

        // Log the extracted data according to 1.1 Required Data Fields specification
        console.log('✅ Processed Wathiq data (1.1 Required Data Fields):');
        console.log('  📋 CR Information:', {
            cr_number: processedData.cr_number,
            cr_national_number: processedData.cr_national_number,
            trade_name: processedData.trade_name
        });
        console.log('  🏛️ Legal & Status:', {
            legal_form: processedData.legal_form,
            registration_status: processedData.registration_status,
            city: processedData.city,
            issue_date_gregorian: processedData.issue_date_gregorian,
            confirmation_date_gregorian: processedData.confirmation_date_gregorian
        });
        console.log('  📞 Contact Info:', processedData.contact_info);
        console.log('  🏢 Activities:', processedData.activities);
        console.log('  🛒 E-commerce:', {
            has_ecommerce: processedData.has_ecommerce,
            store_url: processedData.store_url
        });
        console.log('  💰 Capital:', {
            cr_capital: processedData.cr_capital,
            cash_capital: processedData.cash_capital
        });
        console.log('  👥 Management:', {
            structure: processedData.management_structure,
            managers: processedData.management_managers
        });
        
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
     * Extract activities as array (1.1 Required Data Fields)
     */
    extractActivities(activities) {
        if (!activities || !Array.isArray(activities)) return [];
        
        const extractedActivities = activities.map(activity => {
            if (typeof activity === 'string') return activity;
            return activity.name || activity.activityName || activity.sectorName;
        }).filter(Boolean);
        
        // Log extracted activities for debugging
        console.log('🔍 extractActivities - Raw activities:', activities);
        console.log('✅ extractActivities - Processed activities:', extractedActivities);
        
        return extractedActivities;
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
        console.log('🔍 extractCashCapital - Raw capital data:', capital);
        
        if (!capital) {
            console.log('❌ extractCashCapital - No capital data found');
            return null;
        }
        
        // Try multiple possible paths for cash capital (prioritizing 1.1 Required Data Fields)
        const possiblePaths = [
            'contributionCapital.cashCapital',  // Primary path as per specification
            'stockCapital.cashCapital',
            'cashCapital',
            'paidCapital',
            'subscribedCapital',
            'issuedCapital'
        ];
        
        for (const path of possiblePaths) {
            const keys = path.split('.');
            let value = capital;
            
            for (const key of keys) {
                if (value && typeof value === 'object' && key in value) {
                    value = value[key];
                } else {
                    value = null;
                    break;
                }
            }
            
            if (value !== null && value !== undefined) {
                console.log(`✅ extractCashCapital - Found value at path '${path}':`, value);
                
                if (typeof value === 'number') {
                    return value;
                }
                
                if (typeof value === 'string') {
                    const parsed = parseFloat(value.replace(/[^\d.]/g, ''));
                    return isNaN(parsed) ? null : parsed;
                }
            }
        }
        
        console.log('❌ extractCashCapital - No valid cash capital found in any path');
        return null;
    }

    /**
     * Extract in-kind capital
     */
    extractInKindCapital(capital) {
        if (!capital || !capital.contributionCapital) return null;
        
        const inKindCapital = capital.contributionCapital.inKindCapital;
        if (typeof inKindCapital === 'number') return inKindCapital.toString();
        if (typeof inKindCapital === 'string') return inKindCapital;
        
        return null;
    }

    /**
     * Calculate average capital
     */
    calculateAverageCapital(capital) {
        if (!capital || !capital.contributionCapital) return null;
        
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
     * Extract store URL (1.1 Required Data Fields)
     */
    extractStoreUrl(eCommerce) {
        console.log('🔍 extractStoreUrl - Raw eCommerce data:', eCommerce);
        
        if (!eCommerce || !eCommerce.eStore || !Array.isArray(eCommerce.eStore)) {
            console.log('❌ extractStoreUrl - No eCommerce or eStore array found');
            return null;
        }
        
        console.log('🔍 extractStoreUrl - eStore array found:', eCommerce.eStore);
        
        const store = eCommerce.eStore[0];
        console.log('🔍 extractStoreUrl - First store:', store);
        
        // Try multiple possible URL fields as per specification
        const storeUrl = store?.storeUrl || store?.url || store?.website || store?.store_url || null;
        console.log('✅ extractStoreUrl - Extracted store URL:', storeUrl);
        
        return storeUrl;
    }

    /**
     * Extract management structure
     */
    extractManagementStructure(management) {
        if (!management) return null;
        
        // Try multiple possible paths for management structure
        const structure = management.structureName || 
                         management.structure || 
                         management.type || 
                         management.structureType ||
                         management.managementType ||
                         management.form ||
                         management.category;
        
        if (structure) {
            const lowerStructure = structure.toLowerCase();
            
            // Map common short values to more descriptive ones
            const structureMap = {
                'manger': 'Manager',
                'manager': 'Manager',
                'owner': 'Owner',
                'board': 'Board of Directors',
                'directors': 'Board of Directors',
                'assembly': 'General Assembly',
                'partnership': 'Partnership',
                'corporation': 'Corporation',
                'establishment': 'Establishment',
                'company': 'Company'
            };
            
            const mappedStructure = structureMap[lowerStructure];
            if (mappedStructure) {
                return mappedStructure;
            }
            
            // If it's a short value, try to capitalize it properly
            if (structure.length <= 10) {
                return structure.charAt(0).toUpperCase() + structure.slice(1).toLowerCase();
            }
            
            return structure;
        }
        
        return null;
    }

    /**
     * Extract management managers (1.1 Required Data Fields)
     */
    extractManagementManagers(management) {
        if (!management) return [];
        
        // Try multiple possible paths for managers
        const managers = management.managers || 
                        management.managersList || 
                        management.managementTeam ||
                        management.team ||
                        management.directors ||
                        management.owners ||
                        management.partners;
        
        if (!Array.isArray(managers)) {
            // If it's not an array, try to handle single manager cases
            if (typeof managers === 'string') {
                return [managers];
            }
            
            if (managers && typeof managers === 'object') {
                // If it's a single manager object
                const managerName = managers.name || managers.fullName || managers.managerName || managers.directorName;
                if (managerName) {
                    return [managerName];
                }
            }
            
            return [];
        }
        
        const extractedManagers = managers.map(manager => {
            if (typeof manager === 'string') return manager;
            
            if (typeof manager === 'object' && manager !== null) {
                // Try multiple possible name fields
                return manager.name || 
                       manager.fullName || 
                       manager.managerName || 
                       manager.directorName ||
                       manager.ownerName ||
                       manager.partnerName ||
                       manager.arabicName ||
                       manager.englishName;
            }
            
            return null;
        }).filter(Boolean);
        
        // Log extracted managers for debugging
        console.log('🔍 extractManagementManagers - Raw management:', management);
        console.log('✅ extractManagementManagers - Processed managers:', extractedManagers);
        
        return extractedManagers;
    }

    /**
     * Extract contact information
     * @param {Object} contactInfo - Contact info from Wathiq API
     * @returns {Object} - Processed contact information
     */
    extractContactInfo(contactInfo) {
        if (!contactInfo) return null;
        
        const processed = {};
        
        // Required contact fields as per specification (1.1 Required Data Fields)
        if (contactInfo.email) processed.email = contactInfo.email;
        if (contactInfo.mobile) processed.mobile = contactInfo.mobile;
        if (contactInfo.phone) processed.phone = contactInfo.phone;
        
        // Additional contact fields that might be available
        if (contactInfo.website) processed.website = contactInfo.website;
        if (contactInfo.fax) processed.fax = contactInfo.fax;
        if (contactInfo.address) processed.address = contactInfo.address;
        
        // Log extracted contact info for debugging
        console.log('🔍 extractContactInfo - Raw contactInfo:', contactInfo);
        console.log('✅ extractContactInfo - Processed contact info:', processed);
        
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

const wathiqAPIService = new WathiqAPIService();
export default wathiqAPIService;
