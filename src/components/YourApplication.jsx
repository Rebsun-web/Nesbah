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
  const [elapsedTimes, setElapsedTimes] = useState({});

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch(`/api/posApplication/${user.user_id}`);
        const data = await res.json();
        if (data.success) {
          setApplications(data.data);
          const now = new Date();
          const initialTimes = {};
          data.data.forEach((app) => {
            const submittedAt = new Date(app.submitted_at);
            const diffSeconds = Math.floor((now - submittedAt) / 1000);
            initialTimes[app.application_id] = diffSeconds;
          });
          setElapsedTimes(initialTimes);
        }
      } catch (err) {
        console.error('Error fetching applications:', err);
      }
    };

    if (user?.user_id) {
      fetchApplications();
    }
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTimes((prevTimes) => {
        const updated = { ...prevTimes };
        Object.keys(updated).forEach((id) => {
          updated[id] += 1;
        });
        return updated;
      });
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
              Last updated: {new Date().toLocaleTimeString()}
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
                    <CheckCircleIcon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {t('application.application')} #{index + 1}
                    </h3>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-sm text-slate-500">
                        Submitted: {new Date(app.submitted_at).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-slate-500">
                        {new Date(app.submitted_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800">
                    {elapsedTimes[app.application_id] >= 432000
                      ? t('application.expired')
                      : `⏳ ${formatDuration(elapsedTimes[app.application_id] || 0)}`}
                  </span>
                </div>
              </div>

              {/* Application Details */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                  <BuildingOfficeIcon className="h-5 w-5 text-indigo-600 mr-2" />
                  {t('application.details')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="text-xs font-medium text-blue-700">{t('application.submittedAt')}</div>
                        <div className="text-sm font-bold text-blue-900">
                          {new Date(app.submitted_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {app.cr_number && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
                      <div className="flex items-center space-x-2">
                        <DocumentTextIcon className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="text-xs font-medium text-green-700">{t('application.crNumber')}</div>
                          <div className="text-sm font-bold text-green-900">{app.cr_number}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-3 border border-purple-100">
                    <div className="flex items-center space-x-2">
                      <CreditCardIcon className="h-4 w-4 text-purple-600" />
                      <div>
                        <div className="text-xs font-medium text-purple-700">{t('application.posDevices')}</div>
                        <div className="text-sm font-bold text-purple-900">{app.number_of_pos_devices}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-100">
                    <div className="flex items-center space-x-2">
                      <MapPinIcon className="h-4 w-4 text-orange-600" />
                      <div>
                        <div className="text-xs font-medium text-orange-700">{t('application.cityOfOperation')}</div>
                        <div className="text-sm font-bold text-orange-900">{app.city_of_operation}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-3 border border-indigo-100">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4 text-indigo-600" />
                      <div>
                        <div className="text-xs font-medium text-indigo-700">{t('application.contactPerson')}</div>
                        <div className="text-sm font-bold text-indigo-900">{app.contact_person}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-3 border border-teal-100">
                    <div className="flex items-center space-x-2">
                      <PhoneIcon className="h-4 w-4 text-teal-600" />
                      <div>
                        <div className="text-xs font-medium text-teal-700">{t('application.mobileNumber')}</div>
                        <div className="text-sm font-bold text-teal-900">{app.contact_person_number}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-lg p-3 border border-slate-100">
                    <div className="flex items-center space-x-2">
                      <DocumentTextIcon className="h-4 w-4 text-slate-600" />
                      <div>
                        <div className="text-xs font-medium text-slate-700">{t('application.ownPosSystem')}</div>
                        <div className="text-sm font-bold text-slate-900">
                          {app.own_pos_system ? t('common.yes') : t('common.no')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {app.notes && (
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-3 border border-yellow-100 md:col-span-3">
                      <div className="flex items-start space-x-2">
                        <DocumentTextIcon className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <div>
                          <div className="text-xs font-medium text-yellow-700">{t('application.notes')}</div>
                          <div className="text-sm text-yellow-900">{app.notes}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Uploaded Document */}
              {app.uploaded_document && (
                <div className="mb-6 pt-6 border-t border-slate-200">
                  <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                    <DocumentIcon className="h-5 w-5 text-indigo-600 mr-2" />
                    {t('application.uploadedDocuments')}
                  </h4>
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <DocumentIcon className="h-4 w-4 text-indigo-600" />
                        <div>
                          <div className="text-xs font-medium text-indigo-700">{t('application.applicationDocument')}</div>
                          <div className="text-sm text-indigo-900">{t('application.clickToDownload')}</div>
                        </div>
                      </div>
                      <a
                        href={`/api/download/${app.application_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg hover:shadow-xl"
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
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 flex-shrink-0">
              <DocumentIcon className="h-3 w-3 text-blue-600" />
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
