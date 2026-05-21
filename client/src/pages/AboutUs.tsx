import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Users, Shield, CheckCircle, Star, Eye, Mail } from "lucide-react";

export default function AboutUs() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-grow">
        <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#202020] mb-4 text-center">
              About Us
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold text-[#444444] mb-6 text-center">
              RateMyCoach
            </h2>
            <p className="text-lg text-[#666666] text-center max-w-2xl mx-auto">
              Bringing transparency, accountability, and clarity to the online fitness coaching space.
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="prose prose-lg max-w-none">
              <p className="text-[#444444] leading-relaxed mb-8">
                <strong>RateMyCoach</strong> was created to bring transparency, accountability, and clarity to the online fitness coaching space. The fitness industry has grown rapidly over the past decade, with thousands of coaches offering services online through social media, apps, and direct messaging. While many coaches provide outstanding guidance and support, there is currently no central, trusted place for clients to share verified experiences—both positive and negative.
              </p>
              <p className="text-[#444444] leading-relaxed font-semibold text-xl">
                RateMyCoach exists to change that.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#F5C518]/20 flex items-center justify-center">
                <Star className="w-6 h-6 text-[#F5C518]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#202020]">Our Mission</h2>
            </div>
            <p className="text-[#444444] leading-relaxed mb-6">
              Our mission is simple: <strong>to give athletes and clients a reliable platform to share honest, verified experiences with fitness coaches</strong>, and to help others make informed decisions before investing their time, money, and trust.
            </p>
            <p className="text-[#444444] leading-relaxed">
              This platform is not designed to attack coaches or promote drama. It is designed to promote transparency, professionalism, and higher standards across the industry.
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#F5C518]/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-[#F5C518]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#202020]">How It Works</h2>
            </div>
            <p className="text-[#444444] leading-relaxed mb-6">
              RateMyCoach is a <strong>private, registration-based review platform</strong>.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#F5C518] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[#111111] text-sm font-bold">1</span>
                </div>
                <span className="text-[#444444]">Users must create an account and verify their identity before submitting any review</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#F5C518] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[#111111] text-sm font-bold">2</span>
                </div>
                <span className="text-[#444444]">Every review submission requires proof of a real coaching relationship (such as a payment receipt or transaction confirmation)</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#F5C518] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[#111111] text-sm font-bold">3</span>
                </div>
                <span className="text-[#444444]">Reviews are manually reviewed before being published</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#F5C518] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[#111111] text-sm font-bold">4</span>
                </div>
                <span className="text-[#444444]">Coach profiles display average ratings, written feedback, and basic public information</span>
              </li>
            </ul>
            <p className="text-[#444444] leading-relaxed bg-[#F5C518]/10 p-4 rounded-lg border-l-4 border-[#F5C518]">
              This verification process helps ensure that reviews come from real clients with real experiences—not anonymous accounts or fake submissions.
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-[#F5C518]/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-[#F5C518]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#202020]">For Athletes & Clients</h3>
                </div>
                <p className="text-[#444444] mb-4">If you are researching a coach, RateMyCoach allows you to:</p>
                <ul className="space-y-2 text-[#444444]">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#F5C518]" />
                    Browse coach profiles and ratings
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#F5C518]" />
                    Read verified client experiences
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#F5C518]" />
                    Understand coaching styles and outcomes
                  </li>
                </ul>
                <p className="text-[#666666] mt-4 text-sm italic">Our goal is to help you choose a coach with confidence.</p>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-[#F5C518]/20 flex items-center justify-center">
                    <Star className="w-6 h-6 text-[#F5C518]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#202020]">For Coaches</h3>
                </div>
                <p className="text-[#444444] mb-4">If you are a coach, RateMyCoach provides:</p>
                <ul className="space-y-2 text-[#444444]">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#F5C518]" />
                    A transparent public profile
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#F5C518]" />
                    Build trust through accountability
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#F5C518]" />
                    Rewards for professionalism
                  </li>
                </ul>
                <p className="text-[#666666] mt-4 text-sm italic">Great coaches deserve recognition—clear standards benefit everyone.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#F5C518]/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#F5C518]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#202020]">Independence & Integrity</h2>
            </div>
            <p className="text-[#444444] leading-relaxed mb-4">
              RateMyCoach is an <strong>independent platform</strong>. Reviews reflect the opinions and experiences of individual users and do not represent endorsements or accusations by RateMyCoach itself.
            </p>
            <p className="text-[#444444] leading-relaxed">
              All content is moderated, and we reserve the right to remove submissions that violate our guidelines or cannot be properly verified.
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#F5C518]/20 flex items-center justify-center">
                <Eye className="w-6 h-6 text-[#F5C518]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#202020]">Looking Ahead</h2>
            </div>
            <p className="text-[#444444] leading-relaxed">
              Our initial focus is on delivering a clean, simple, and trustworthy review system. Over time, we plan to expand features, improve discovery tools, and introduce optional advertising opportunities relevant to the fitness industry—without compromising user trust.
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="bg-[#202020] rounded-2xl p-8 md:p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[#F5C518]/20 flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-[#F5C518]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Contact Us</h2>
              <p className="text-gray-300 mb-6">
                For questions, concerns, or verification inquiries, please contact us through the site's contact form.
              </p>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
