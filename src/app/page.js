import Hero from '@/components/Hero';
import Pricing from '@/components/Pricing';
import WhyChooseUs from '@/components/WhyChooseUs';
import ServiceArea from '@/components/ServiceArea';
import QuoteForm from '@/components/QuoteForm';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main>
      <Hero />
      <Pricing />
      <WhyChooseUs />
      <ServiceArea />
      <QuoteForm />
      <Footer />
    </main>
  );
}