'use client'

import { useState } from 'react'
import { PhotoIcon } from '@heroicons/react/24/solid'
import emailjs from '@emailjs/browser'


export function PosApplication({ user, onSuccess}) {
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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
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
    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
    };

    try {
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
    }
  };

  return (
      <div className="divide-y divide-gray-900/10">
        <div className="grid grid-cols-1 gap-y-8 pb-10">
          <form
              className="rounded-xl bg-gray-100 shadow-sm ring-1 ring-gray-900/5"
              onSubmit={handleSubmit}
          >
            <div className="px-4 py-6 sm:p-8">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                {/* CR National Number */}
                <div>
                  <label htmlFor="cr_national_number" className="block text-sm font-medium text-gray-900">
                    CR national number
                  </label>
                  <div className="mt-2">
                    <div
                        className="flex items-center rounded-md bg-white pl-3 outline outline-1 outline-gray-300 focus-within:outline-indigo-600">
                      <input
                          id="cr_national_number"
                          name="cr_national_number"
                          type="text"
                          value={crNationalNumber}
                          readOnly
                          className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Trade Name */}
                <div>
                  <label htmlFor="trade_name" className="block text-sm font-medium text-gray-900">
                    Trade name
                  </label>
                  <div className="mt-2">
                    <div
                        className="flex items-center rounded-md bg-white pl-3 outline outline-1 outline-gray-300 focus-within:outline-indigo-600">
                      <input
                          id="trade_name"
                          name="trade_name"
                          type="text"
                          value={tradeName}
                          readOnly
                          className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                      />
                    </div>
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
                    <div
                        className="flex items-center rounded-md bg-white pl-3 outline outline-1 outline-gray-300 focus-within:outline-indigo-600">
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
                    <div
                        className="flex items-center rounded-md bg-white pl-3 outline outline-1 outline-gray-300 focus-within:outline-indigo-600">
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
                    <div
                        className="flex items-center rounded-md bg-white pl-3 outline outline-1 outline-gray-300 focus-within:outline-indigo-600">
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
                    <div
                        className="flex items-center rounded-md bg-white pl-3 outline outline-1 outline-gray-300 focus-within:outline-indigo-600">
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
                    City of operation
                  </label>
                  <div className="mt-2">
                    <div
                        className="flex items-center rounded-md bg-white pl-3 outline outline-1 outline-gray-300 focus-within:outline-indigo-600">
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


                {/* Notes */}
                <div className="lg:col-span-2">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-900">
                    Notes
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
                    Upload document
                  </label>
                  <div
                      className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                    <div className="text-center">
                      <PhotoIcon className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true"/>
                      <div className="mt-4 flex text-sm text-gray-600">
                        <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 hover:text-indigo-500"
                        >
                          <span>Upload a file</span>
                          <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              onChange={handleFileUpload}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-600">pdf, JPG, .docx up to 10MB</p>
                    </div>
                  </div>
                  {uploadedFile && (
                      <div className="mt-4 text-sm text-gray-700">
                        <p><strong>Uploaded file(s):</strong> {uploadedFile.name}</p>
                        <a
                            href={URL.createObjectURL(uploadedFile)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline"
                        >
                          Preview file
                        </a>
                      </div>
                  )}
                </div>

              </div>
            </div>

            {/* Form Footer */}
            <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
              <button type="button" className="text-sm font-semibold text-gray-900">
                Reset
              </button>
              <button
                  type="submit"
                  className="rounded-full bg-gradient-to-r from-[#1E1851] to-[#4436B7] px-6 py-2 text-sm font-normal text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-indigo-600"
              >
                Submit Application
              </button>
            </div>
          </form>
        </div>
      </div>
  )
}
