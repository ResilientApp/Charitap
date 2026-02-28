const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFCP, getLCP, getTTFB, getINP, getFID }) => {
      if (getCLS) getCLS(onPerfEntry);
      if (getFCP) getFCP(onPerfEntry);
      if (getLCP) getLCP(onPerfEntry);
      if (getTTFB) getTTFB(onPerfEntry);
      // getINP replaced getFID as a Core Web Vital in 2024; fall back to getFID on older web-vitals versions
      const inp = getINP || getFID;
      if (inp) inp(onPerfEntry);
    }).catch(err => {
      console.error('Failed to load web-vitals', err);
    });
  }
};

export default reportWebVitals;
