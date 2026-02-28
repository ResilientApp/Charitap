const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then((vitals) => {
      vitals.getCLS(onPerfEntry);
      vitals.getFCP(onPerfEntry);
      vitals.getLCP(onPerfEntry);
      vitals.getTTFB(onPerfEntry);
      // getINP replaced getFID as a Core Web Vital in 2024; fall back to getFID on older web-vitals versions
      const inp = vitals.getINP || vitals.getFID;
      if (inp) inp(onPerfEntry);
    });
  }
};

export default reportWebVitals;
