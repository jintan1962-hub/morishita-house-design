import "@/app/globals.css";
import "@/app/(home)/style.css";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Script from "next/script";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* GA4 & UA 計測用追加 */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-8B64PSYP4M"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'UA-161807317-6');
          gtag('config', 'G-8B64PSYP4M');
          gtag('config', 'AW-951165690');
        `}
      </Script>

      <Script
        src="https://s.yimg.jp/images/listing/tool/cv/ytag.js"
        strategy="afterInteractive"
      />
      <Script id="yahoo-tag" strategy="afterInteractive">
        {`
          window.yjDataLayer = window.yjDataLayer || [];
          function ytag() { yjDataLayer.push(arguments); }
          ytag({"type":"ycl_cookie"});
        `}
      </Script>

      <Script id="clarity-script" strategy="afterInteractive">
        {`
          (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "htt9wpb13p");
        `}
      </Script>

      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '612628776889149');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src="https://www.facebook.com/tr?id=612628776889149&ev=PageView&noscript=1"
        />
      </noscript>

      <Header />
      <main className="flex-grow flex flex-col">{children}</main>
      <Footer />
    </>
  );
}
