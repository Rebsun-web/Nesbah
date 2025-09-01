'use client'

import { useState } from 'react'
import { PhotoIcon } from '@heroicons/react/24/solid'
import emailjs from '@emailjs/browser'
import { useLanguage } from '@/contexts/LanguageContext'

export function PosApplication({ user, onSuccess}) {
  const { t } = useLanguage()
  const crNationalNumber = user?.business?.cr_national_number || '';
  const tradeName = user?.business?.trade_name || '';
  const email = user?.email || '';

  const [ownPosSystem, setOwnPosSystem] = useState('no');
  const [notes, setNotes] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [base64File, setBase64File] = useState(null);

  const [contactPerson, setContactPerson] = useState('');
  const [contactPersonNumber, setContactPersonNumber] = useState('');
  const [numberOfPos, setNumberOfPos] = useState('');
  const [cityOfOperation, setCityOfOperation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New POS application fields
  const [posProviderName, setPosProviderName] = useState('');
  const [posAgeDuration, setPosAgeDuration] = useState('');
  const [avgMonthlyPosSales, setAvgMonthlyPosSales] = useState('');
  const [requestedFinancingAmount, setRequestedFinancingAmount] = useState('');
  const [preferredRepaymentPeriod, setPreferredRepaymentPeriod] = useState('');

  const clearUploadedFile = () => {
    setUploadedFile(null);
    setBase64File(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload only PDF, JPG, or DOCX files.');
      return;
    }

    // Validate file size (10MB = 10 * 1024 * 1024 bytes)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 10MB.');
      return;
    }

    setUploadedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      setBase64File({
        data: base64,
        name: file.name,
        type: file.type
      });
      console.log('Uploaded file preview:', reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!contactPerson.trim()) {
      alert('Please enter a contact person.');
      return;
    }

    if (!contactPersonNumber.trim()) {
      alert('Please enter a contact mobile number.');
      return;
    }

    if (!numberOfPos.trim()) {
      alert('Please enter the number of POS devices required.');
      return;
    }

    if (!cityOfOperation.trim()) {
      alert('Please enter the city of operation.');
      return;
    }

    // Validate new required POS fields
    if (!posProviderName.trim()) {
      alert('Please enter the POS provider name.');
      return;
    }

    if (!posAgeDuration.trim()) {
      alert('Please enter the POS age duration in months.');
      return;
    }

    if (!avgMonthlyPosSales.trim()) {
      alert('Please enter the average monthly POS sales amount.');
      return;
    }

    if (!requestedFinancingAmount.trim()) {
      alert('Please enter the requested financing amount.');
      return;
    }

    setIsSubmitting(true);

    const formData = {
      user_id: user.user_id,
      cr_national_number: user.business.cr_national_number,
      city: user.business.address,
      status: 'submitted',
      notes: notes,
      uploaded_document: base64File?.data || null,
      uploaded_filename: base64File?.name || null,
      uploaded_mimetype: base64File?.type || null,
      own_pos_system: ownPosSystem === 'yes',
      contact_person: contactPerson,
      contact_person_number: contactPersonNumber,
      number_of_pos_devices: numberOfPos,
      city_of_operation: cityOfOperation,
      // New POS application fields
      pos_provider_name: posProviderName,
      pos_age_duration_months: parseInt(posAgeDuration) || 0,
      avg_monthly_pos_sales: parseFloat(avgMonthlyPosSales) || 0,
      requested_financing_amount: parseFloat(requestedFinancingAmount) || 0,
      preferred_repayment_period_months: preferredRepaymentPeriod ? parseInt(preferredRepaymentPeriod) : null
    };

    try {
      console.log('📤 Submitting POS application with data:', {
        ...formData,
        uploaded_document: base64File ? `${base64File.data.substring(0, 50)}...` : null
      });
      
      const response = await fetch('/api/posApplication', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        console.log('Application submitted successfully:', data);
        if (onSuccess) {
          onSuccess(); // ✅ trigger modal from parent
        }
        // Fetch all bank user emails
        const bankUserRes = await fetch('/api/users/GET/bankUsers');
        const bankUserData = await bankUserRes.json();
        console.log('📥 Bank user API response:', bankUserData);
        const bankUserEmails = Array.isArray(bankUserData?.data) ? bankUserData.data : [];
        // Send email using EmailJS, one per bank user
        for (const email of bankUserEmails.filter(Boolean)) {
          try {
            console.log('📤 Attempting to send email to', email);
            await emailjs.send(
              process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
              process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
              {
                to_email: email,
              },
              process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
            );
            console.log('✅ Email sent successfully to', email);
          } catch (error) {
            console.error(`❌ Failed to send email to ${email}.`, error);
          }
        }
      } else {
        console.error('Application submission failed:', data.error);
      }
    } catch (error) {
      console.error('Unexpected error submitting application:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Apply for Service</h1>
                <p className="text-indigo-100">Complete your POS finance application</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="px-8 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Please fill in all required fields to submit your application
            </p>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="px-8 py-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* CR National Number */}
            <div>
              <label htmlFor="cr_national_number" className="block text-sm font-semibold text-slate-700 mb-2">
                CR National Number
              </label>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                <input
                  id="cr_national_number"
                  name="cr_national_number"
                  type="text"
                  value={crNationalNumber}
                  readOnly
                  className="block w-full bg-transparent text-sm font-medium text-blue-900 border-none outline-none"
                />
              </div>
            </div>

            {/* Trade Name */}
            <div>
              <label htmlFor="trade_name" className="block text-sm font-semibold text-slate-700 mb-2">
                Trade Name
              </label>
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-3 border border-purple-100">
                <input
                  id="trade_name"
                  name="trade_name"
                  type="text"
                  value={tradeName}
                  readOnly
                  className="block w-full bg-transparent text-sm font-medium text-purple-900 border-none outline-none"
                />
              </div>
            </div>

            {/* POS System */}
            <div>
              <label htmlFor="own_pos_system" className="block text-sm font-medium text-gray-900">
                Do you already have a POS system?
              </label>
              <div className="mt-2">
                <select
                  id="own_pos_system"
                  name="own_pos_system"
                  value={ownPosSystem}
                  onChange={(e) => setOwnPosSystem(e.target.value)}
                  className="block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 outline outline-1 outline-gray-300 focus:outline-indigo-600"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                Email
              </label>
              <div className="mt-2">
                <div className="flex items-center rounded-md bg-white pl-3 outline outline-1 outline-gray-300 focus-within:outline-indigo-600">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    readOnly
                    className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="contactperson" className="block text-sm font-medium text-gray-900">
                Contact person
              </label>
              <div className="mt-2">
                <div className="flex items-center rounded-md bg-white pl-3 outline outline-1 outline-gray-300 focus-within:outline-indigo-600">
                  <input
                    id="contactperson"
                    name="contactperson"
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="contactpersonnumber" className="block text-sm font-medium text-gray-900">
                Contact mobile number
              </label>
              <div className="mt-2">
                <div className="flex items-center rounded-md bg-white pl-3 outline outline-1 outline-gray-300 focus-within:outline-indigo-600">
                  <input
                    id="contactpersonnumber"
                    name="contactpersonnumber"
                    type="text"
                    value={contactPersonNumber}
                    onChange={(e) => setContactPersonNumber(e.target.value)}
                    className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="nrofpos" className="block text-sm font-medium text-gray-900">
                Number of POS devices required
              </label>
              <div className="mt-2">
                <div className="flex items-center rounded-md bg-white pl-3 outline outline-1 outline-gray-300 focus-within:outline-indigo-600">
                  <input
                    id="nrofpos"
                    name="nrofpos"
                    type="text"
                    value={numberOfPos}
                    onChange={(e) => setNumberOfPos(e.target.value)}
                    className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="cityofoperation" className="block text-sm font-medium text-gray-900">
                {t('pos.cityOfOperation')}
              </label>
              <div className="mt-2">
                <div className="flex items-center rounded-md bg-white pl-3 outline outline-1 outline-gray-300 focus-within:outline-indigo-600">
                  <input
                    id="cityofoperation"
                    name="cityofoperation"
                    type="text"
                    value={cityOfOperation}
                    onChange={(e) => setCityOfOperation(e.target.value)}
                    className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* New POS Application Fields */}
            <div>
              <label htmlFor="posProviderName" className="block text-sm font-medium text-gray-900">
                POS Provider Name *
              </label>
              <div className="mt-2">
                <div className="flex items-center rounded-md bg-white pl-3 outline outline-1 outline-gray-300 focus-within:outline-indigo-600">
                  <input
                    id="posProviderName"
                    name="posProviderName"
                    type="text"
                    value={posProviderName}
                    onChange={(e) => setPosProviderName(e.target.value)}
                    className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                    placeholder="e.g., Verifone, Ingenico, PAX"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="posAgeDuration" className="block text-sm font-medium text-gray-900">
                POS Age Duration (months) *
              </label>
              <div className="mt-2">
                <div className="flex items-center rounded-md bg-white pl-3 outline outline-1 outline-gray-300 focus-within:outline-indigo-600">
                  <input
                    id="posAgeDuration"
                    name="posAgeDuration"
                    type="number"
                    min="0"
                    value={posAgeDuration}
                    onChange={(e) => setPosAgeDuration(e.target.value)}
                    className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                    placeholder="e.g., 24"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="avgMonthlyPosSales" className="block text-sm font-medium text-gray-900">
                Average Monthly POS Sales (SAR) *
              </label>
              <div className="mt-2">
                <div className="flex items-center rounded-md bg-white pl-3 outline outline-1 outline-gray-300 focus-within:outline-indigo-600">
                  <input
                    id="avgMonthlyPosSales"
                    name="avgMonthlyPosSales"
                    type="number"
                    min="0"
                    step="0.01"
                    value={avgMonthlyPosSales}
                    onChange={(e) => setAvgMonthlyPosSales(e.target.value)}
                    className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                    placeholder="e.g., 50000.00"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="requestedFinancingAmount" className="block text-sm font-medium text-gray-900">
                Requested Financing Amount (SAR) *
              </label>
              <div className="mt-2">
                <div className="flex items-center rounded-md bg-white pl-3 outline outline-1 outline-gray-300 focus-within:outline-indigo-600">
                  <input
                    id="requestedFinancingAmount"
                    name="requestedFinancingAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={requestedFinancingAmount}
                    onChange={(e) => setRequestedFinancingAmount(e.target.value)}
                    className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                    placeholder="e.g., 100000.00"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="preferredRepaymentPeriod" className="block text-sm font-medium text-gray-900">
                Preferred Repayment Period (months)
              </label>
              <div className="mt-2">
                <div className="flex items-center rounded-md bg-white pl-3 outline outline-1 outline-gray-300 focus-within:outline-indigo-600">
                  <input
                    id="preferredRepaymentPeriod"
                    name="preferredRepaymentPeriod"
                    type="number"
                    min="1"
                    max="120"
                    value={preferredRepaymentPeriod}
                    onChange={(e) => setPreferredRepaymentPeriod(e.target.value)}
                    className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                    placeholder="e.g., 24 (optional)"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="lg:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-900">
                {t('pos.notes')}
              </label>
              <div className="mt-2">
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-sm text-gray-900 outline outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600"
                />
              </div>
            </div>

            {/* Upload */}
            <div className="lg:col-span-2">
              <label htmlFor="file-upload" className="block text-sm font-medium text-gray-900">
                {t('pos.uploadDocument')}
              </label>
              <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                <div className="text-center">
                  <PhotoIcon className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true"/>
                  <div className="mt-4 flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 hover:text-indigo-500"
                    >
                      <span>{t('pos.uploadFile')}</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.docx"
                        className="sr-only"
                        onChange={handleFileUpload}
                      />
                    </label>
                    <p className="pl-1">{t('pos.orDragAndDrop')}</p>
                  </div>
                  <p className="text-xs text-gray-600">{t('pos.fileTypes')}</p>
                </div>
              </div>
              {uploadedFile && (
                <div className="mt-4 text-sm text-gray-700">
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-green-800">{uploadedFile.name}</p>
                        <p className="text-green-600">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a
                        href={URL.createObjectURL(uploadedFile)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        {t('pos.previewFile')}
                      </a>
                      <button
                        type="button"
                        onClick={clearUploadedFile}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Footer */}
          <div className="flex items-center justify-end gap-x-6 border-t border-slate-200 pt-6 mt-6">
            <button type="button" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
              {t('common.reset')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`rounded-lg px-6 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all duration-200 ${
                isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Submitting...</span>
                </div>
              ) : (
                t('pos.submitApplication')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
