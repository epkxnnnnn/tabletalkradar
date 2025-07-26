import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - TabletalkRadar',
  description: 'Terms of Service for TabletalkRadar business intelligence platform',
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose max-w-none">
            <p className="text-sm text-gray-600 mb-6">
              <strong>Effective Date:</strong> January 26, 2025<br />
              <strong>Last Updated:</strong> January 26, 2025
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                Welcome to TabletalkRadar ("we," "our," or "us"). These Terms of Service ("Terms") govern your use of our business intelligence platform and related services (the "Service") operated by TabletalkRadar.
              </p>
              <p className="text-gray-700">
                By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these Terms, then you may not access the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                TabletalkRadar is a comprehensive business intelligence platform that provides:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Multi-AI business analysis and insights</li>
                <li>Google Business Profile management and optimization</li>
                <li>Review monitoring and response automation</li>
                <li>Social media content creation and scheduling</li>
                <li>Agency dashboard for managing multiple clients</li>
                <li>Performance analytics and reporting</li>
                <li>Customer communication tools</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">3.1 Account Registration</h3>
              <p className="text-gray-700 mb-4">
                To use certain features of the Service, you must register for an account. You agree to provide accurate, complete, and up-to-date information during registration and to update such information as necessary.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3">3.2 Account Security</h3>
              <p className="text-gray-700 mb-4">You are responsible for:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
                <li>Ensuring your account information remains accurate</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">3.3 Account Termination</h3>
              <p className="text-gray-700 mb-4">
                We reserve the right to suspend or terminate your account at any time for violation of these Terms or other reasonable cause. You may also terminate your account at any time by contacting us.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use Policy</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">4.1 Permitted Uses</h3>
              <p className="text-gray-700 mb-4">You may use the Service for legitimate business purposes in accordance with these Terms.</p>

              <h3 className="text-xl font-medium text-gray-900 mb-3">4.2 Prohibited Uses</h3>
              <p className="text-gray-700 mb-4">You agree not to use the Service:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>For any unlawful purpose or to solicit unlawful activity</li>
                <li>To violate any international, federal, provincial, or state regulations or laws</li>
                <li>To transmit malicious code, viruses, or other harmful content</li>
                <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                <li>To submit false or misleading information</li>
                <li>To upload content that infringes on intellectual property rights</li>
                <li>To impersonate any person or entity</li>
                <li>To engage in unauthorized data mining or extraction</li>
                <li>To attempt to gain unauthorized access to our systems</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Subscription and Payment Terms</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">5.1 Subscription Plans</h3>
              <p className="text-gray-700 mb-4">
                We offer various subscription plans with different features and pricing. Current pricing and plan details are available on our website.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3">5.2 Payment</h3>
              <p className="text-gray-700 mb-4">
                Subscription fees are billed in advance on a monthly or annual basis. You authorize us to charge your payment method for all fees incurred. All fees are non-refundable except as required by law.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3">5.3 Price Changes</h3>
              <p className="text-gray-700 mb-4">
                We reserve the right to change our pricing at any time. Price changes will be communicated at least 30 days in advance and will take effect at your next billing cycle.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3">5.4 Cancellation and Refunds</h3>
              <p className="text-gray-700 mb-4">
                You may cancel your subscription at any time. Cancellations take effect at the end of your current billing period. We do not provide refunds for partial subscription periods except as required by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property Rights</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">6.1 Our Rights</h3>
              <p className="text-gray-700 mb-4">
                The Service and its original content, features, and functionality are owned by TabletalkRadar and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3">6.2 Your Content</h3>
              <p className="text-gray-700 mb-4">
                You retain ownership of content you upload to the Service. By uploading content, you grant us a non-exclusive, royalty-free, worldwide license to use, modify, and display such content solely for providing the Service.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3">6.3 Third-Party Content</h3>
              <p className="text-gray-700 mb-4">
                The Service may contain content from third parties, including Google Business Profile data. Such content remains the property of its respective owners and is subject to their terms and conditions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Privacy and Data Protection</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated by reference into these Terms. By using the Service, you consent to the collection and use of information as described in our Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Third-Party Integrations</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">8.1 Google API Services</h3>
              <p className="text-gray-700 mb-4">
                Our Service integrates with Google API Services, including Google Business Profile API. Your use of these integrations is subject to Google's Terms of Service and Privacy Policy. We are not responsible for the availability, accuracy, or functionality of third-party services.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3">8.2 Other Third-Party Services</h3>
              <p className="text-gray-700 mb-4">
                The Service may integrate with other third-party services for communication, analytics, and payment processing. Your use of such services is subject to their respective terms and conditions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Disclaimers and Limitations</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">9.1 Service Availability</h3>
              <p className="text-gray-700 mb-4">
                We strive to maintain high service availability but cannot guarantee uninterrupted access. The Service is provided "as is" and "as available" without warranties of any kind.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3">9.2 AI-Generated Content</h3>
              <p className="text-gray-700 mb-4">
                Our Service uses artificial intelligence to generate business insights and content recommendations. AI-generated content is provided for informational purposes only and should not be considered as professional advice. You are responsible for reviewing and verifying all AI-generated content before use.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3">9.3 Limitation of Liability</h3>
              <p className="text-gray-700 mb-4">
                To the fullest extent permitted by law, TabletalkRadar shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Indemnification</h2>
              <p className="text-gray-700 mb-4">
                You agree to defend, indemnify, and hold harmless TabletalkRadar and its officers, directors, employees, and agents from and against any claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including attorney's fees) arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Dispute Resolution</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">11.1 Governing Law</h3>
              <p className="text-gray-700 mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3">11.2 Dispute Resolution Process</h3>
              <p className="text-gray-700 mb-4">
                Any dispute arising from these Terms shall first be addressed through good faith negotiations. If unresolved, disputes shall be settled through binding arbitration in accordance with the rules of the American Arbitration Association.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Modifications to Terms</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify these Terms at any time. Material changes will be communicated via email or through the Service at least 30 days before taking effect. Your continued use of the Service after changes become effective constitutes acceptance of the revised Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Termination</h2>
              <p className="text-gray-700 mb-4">
                We may terminate or suspend your access to the Service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties. Upon termination, your right to use the Service will cease immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Severability</h2>
              <p className="text-gray-700 mb-4">
                If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that the remaining Terms will remain in full force and effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> legal@tabletalkradar.com<br />
                  <strong>Address:</strong> TabletalkRadar Legal Department<br />
                  1234 Business District Lane<br />
                  Suite 100<br />
                  Technology City, TC 12345<br />
                  United States<br />
                  <strong>Phone:</strong> +1 (555) 123-4567
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Acknowledgment</h2>
              <p className="text-gray-700 mb-4">
                By using our Service, you acknowledge that you have read these Terms of Service, understand them, and agree to be bound by them. If you do not agree to these Terms, you must not use our Service.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}