import React from 'react';
import { assets } from '../../assets/assets';

const companies = [
  { src: assets.microsoft_logo, alt: 'Microsoft' },
  { src: assets.walmart_logo, alt: 'Walmart' },
  { src: assets.accenture_logo, alt: 'Accenture' },
  { src: assets.adobe_logo, alt: 'Adobe' },
  { src: assets.paypal_logo, alt: 'PayPal' },
];

const Companies = () => {
  return (
    <section className="py-14 md:py-16 border-y border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-muted-foreground mb-8">
          Trusted by learners from leading companies worldwide
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {companies.map((company) => (
            <div
              key={company.alt}
              className="flex items-center justify-center h-8 grayscale opacity-40 hover:grayscale-0 hover:opacity-70 transition-all duration-300"
            >
              <img
                src={company.src}
                alt={company.alt}
                className="h-full w-auto"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Companies;
