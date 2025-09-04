'use client'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { 
    ClockIcon, 
    DocumentIcon, 
    BuildingOfficeIcon,
    CalendarIcon,
    UserIcon,
    PhoneIcon,
    MapPinIcon,
    CreditCardIcon,
    DocumentTextIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline'

// Constants
const APPLICATION_TIMEOUT_SECONDS = 48 * 60 * 60; // 48 hours in seconds

function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function YourApplication({ user }) {
  const { t } = useLanguage()
  const [applications, setApplications] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch(`/api/posApplication/${user.user_id}`);
        const data = await res.json();
        if (data.success) {
          setApplications(data.data);
          // No need to set initial elapsed times - we'll calculate them dynamically
        }
      } catch (err) {
        console.error('Error fetching applications:', err);
      }
    };

    if (user?.user_id) {
      fetchApplications();
    }
  }, [user]);

  // Update current time every second for real-time countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!applications.length) return null;

  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                <DocumentIcon className="h-7 w-7 text-white" />
              </div>
                              <div>
                  <h1 className="text-2xl font-bold text-white">{t('application.yourCurrentApplication')}</h1>
                  <p className="text-indigo-100">{t('application.reviewDetails')}</p>
                </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
              >
                <ClockIcon className="h-4 w-4 mr-2" />
                {t('common.refresh')}
              </button>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center rounded-full bg-blue-400 px-3 py-1 text-sm font-medium text-white">
                  {applications.length} {applications.length === 1 ? t('application.application') : t('application.applications')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="px-8 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              {t('application.reviewStatus')}
            </p>
            <p className="text-xs text-slate-500">
              Last updated: {currentTime.toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Applications Content */}
        <div className="px-8 py-6">
          {applications.map((app, index) => (
            <div key={app.application_id} className="mb-6 last:mb-0">
              {/* Application Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                    <CheckCircleIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {t('application.application')} #{index + 1}
                    </h3>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-sm text-gray-500">
                        Submitted: {new Date(app.submitted_at).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(app.submitted_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
                {(() => {
                  const submittedAt = new Date(app.submitted_at);
                  const elapsedSeconds = Math.floor((currentTime - submittedAt) / 1000);
                  const remainingSeconds = APPLICATION_TIMEOUT_SECONDS - elapsedSeconds;
                  
                  // Debug information (can be removed in production)
                  console.log(`App #${app.application_id}: Submitted ${elapsedSeconds}s ago, ${remainingSeconds}s remaining`);
                  
                  // Only show countdown if there's still time remaining
                  if (remainingSeconds > 0) {
                    return (
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800">
                          ⏳ {formatDuration(remainingSeconds)}
                        </span>
                      </div>
                    );
                  } else {
                    // Countdown has expired (48 hours have passed)
                    console.log(`App #${app.application_id}: Countdown expired, hiding timer`);
                    return null;
                  }
                })()}
              </div>

              {/* Application Details */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BuildingOfficeIcon className="h-5 w-5 text-purple-600 mr-2" />
                  {t('application.details')}
                </h4>
                
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="divide-y divide-gray-200">
                    {/* Submitted Date */}
                    <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
                          <CalendarIcon className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{t('application.submittedAt')}</span>
                      </div>
                      <span className="text-sm text-gray-900 font-semibold">
                        {new Date(app.submitted_at).toLocaleString()}
                      </span>
                    </div>

                    {/* CR Number */}
                    {app.cr_number && (
                      <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
                            <DocumentTextIcon className="h-4 w-4 text-purple-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{t('application.crNumber')}</span>
                        </div>
                        <span className="text-sm text-gray-900 font-semibold">{app.cr_number}</span>
                      </div>
                    )}

                    {/* POS Devices */}
                    <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
                          <CreditCardIcon className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{t('application.posDevices')}</span>
                      </div>
                      <span className="text-sm text-gray-900 font-semibold">{app.number_of_pos_devices}</span>
                    </div>

                    {/* City of Operation */}
                    <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
                          <MapPinIcon className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{t('application.cityOfOperation')}</span>
                      </div>
                      <span className="text-sm text-gray-900 font-semibold">{app.city_of_operation}</span>
                    </div>

                    {/* Contact Person */}
                    <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
                          <UserIcon className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{t('application.contactPerson')}</span>
                      </div>
                      <span className="text-sm text-gray-900 font-semibold">{app.contact_person}</span>
                    </div>

                    {/* Mobile Number */}
                    <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
                          <PhoneIcon className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{t('application.mobileNumber')}</span>
                      </div>
                      <span className="text-sm text-gray-900 font-semibold">{app.contact_person_number}</span>
                    </div>

                    {/* Own POS System */}
                    <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
                          <DocumentTextIcon className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{t('application.ownPosSystem')}</span>
                      </div>
                      <span className="text-sm text-gray-900 font-semibold">
                        {app.own_pos_system ? t('common.yes') : t('common.no')}
                      </span>
                    </div>

                    {/* Notes */}
                    {app.notes && (
                      <div className="px-6 py-4 flex items-start justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-start space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0 mt-0.5">
                            <DocumentTextIcon className="h-4 w-4 text-purple-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{t('application.notes')}</span>
                        </div>
                        <span className="text-sm text-gray-900 font-semibold max-w-md text-right">
                          {app.notes}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Uploaded Document */}
              {app.uploaded_document && (
                <div className="mb-6 pt-6 border-t border-slate-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <DocumentIcon className="h-5 w-5 text-purple-600 mr-2" />
                    {t('application.uploadedDocuments')}
                  </h4>
                  
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
                          <DocumentIcon className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">{t('application.applicationDocument')}</div>
                          <div className="text-xs text-gray-500">{t('application.clickToDownload')}</div>
                        </div>
                      </div>
                      <a
                        href={`/api/download/${app.application_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
                      >
                        <DocumentIcon className="h-4 w-4 mr-2" />
                        {t('common.download')}
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-200">
          <div className="flex items-start space-x-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
              <DocumentIcon className="h-3 w-3 text-purple-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-1">{t('application.status')}</h4>
              <p className="text-sm text-slate-600">
                {t('application.statusMessage')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
