import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - TabletalkRadar',
  description: 'Privacy Policy for TabletalkRadar business intelligence platform',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose max-w-none">
            <p className="text-sm text-gray-600 mb-6">
              <strong>Effective Date:</strong> January 26, 2025<br />
              <strong>Last Updated:</strong> January 26, 2025
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                TabletalkRadar ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our business intelligence platform and related services (the "Service").
              </p>
              <p className="text-gray-700">
                By using our Service, you agree to the collection and use of information in accordance with this Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">2.1 Personal Information</h3>
              <p className="text-gray-700 mb-4">We may collect the following personal information:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Name and contact information (email address, phone number)</li>
                <li>Business information (company name, business type, industry)</li>
                <li>Account credentials and authentication data</li>
                <li>Payment and billing information</li>
                <li>Communication preferences</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">2.2 Business Data</h3>
              <p className="text-gray-700 mb-4">We collect and process business-related data including:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Google Business Profile information</li>
                <li>Customer reviews and ratings</li>
                <li>Social media data</li>
                <li>Website analytics and performance metrics</li>
                <li>Location and service information</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">2.3 Technical Information</h3>
              <p className="text-gray-700 mb-4">We automatically collect:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>IP addresses and device information</li>
                <li>Browser type and version</li>
                <li>Usage patterns and preferences</li>
                <li>Log files and error reports</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">We use collected information for the following purposes:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Providing and maintaining our Service</li>
                <li>Processing transactions and billing</li>
                <li>Sending administrative and service-related communications</li>
                <li>Providing customer support and technical assistance</li>
                <li>Analyzing business performance and generating insights</li>
                <li>Improving our Service and developing new features</li>
                <li>Complying with legal obligations</li>
                <li>Detecting and preventing fraud or security breaches</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">4.1 Third-Party Services</h3>
              <p className="text-gray-700 mb-4">We may share information with trusted third-party service providers:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Google APIs:</strong> For accessing Google Business Profile data</li>
                <li><strong>Payment Processors:</strong> For handling billing and transactions</li>
                <li><strong>Communication Services:</strong> For sending emails and SMS notifications</li>
                <li><strong>Analytics Providers:</strong> For service improvement and analytics</li>
                <li><strong>Cloud Infrastructure:</strong> For data storage and processing</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">4.2 Legal Requirements</h3>
              <p className="text-gray-700 mb-4">We may disclose information when required by law or to:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Comply with legal processes or government requests</li>
                <li>Protect our rights, property, or safety</li>
                <li>Investigate potential violations of our Terms of Service</li>
                <li>Prevent fraud or security threats</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibated text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-700 mb-4">We implement appropriate security measures to protect your information:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Employee training on data protection practices</li>
                <li>Incident response and breach notification procedures</li>
              </ul>
              <p className="text-gray-700">
                However, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law. When information is no longer needed, we securely delete or anonymize it.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights and Choices</h2>
              <p className="text-gray-700 mb-4">You have the following rights regarding your personal information:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Access:</strong> Request access to your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Restrict Processing:</strong> Request limitation of data processing</li>
              </ul>
              <p className="text-gray-700">
                To exercise these rights, please contact us at privacy@tabletalkradar.com.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking Technologies</h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar tracking technologies to enhance your experience. You can manage cookie preferences through your browser settings. Note that disabling cookies may affect Service functionality.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Data Transfers</h2>
              <p className="text-gray-700 mb-4">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with applicable data protection laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
              <p className="text-gray-700 mb-4">
                Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware of such collection, we will take steps to delete the information promptly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. Your continued use of the Service after changes become effective constitutes acceptance of the revised policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about this Privacy Policy or our privacy practices, please contact us:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> privacy@tabletalkradar.com<br />
                  <strong>Address:</strong> TabletalkRadar Privacy Office<br />
                  1234 Business District Lane<br />
                  Suite 100<br />
                  Technology City, TC 12345<br />
                  United States
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Google API Services</h2>
              <p className="text-gray-700 mb-4">
                Our Service uses Google API Services. Our use and transfer of information received from Google APIs to any other app will adhere to 
                <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer"> Google API Services User Data Policy</a>, 
                including the Limited Use requirements.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}