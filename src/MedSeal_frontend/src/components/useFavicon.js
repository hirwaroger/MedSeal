import { useEffect } from 'react';

export function useFavicon(href = '/favicon.png') {
  useEffect(() => {
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/png';
    if (link.href !== window.location.origin + href) {
      link.href = href;
    }
  }, [href]);
}
