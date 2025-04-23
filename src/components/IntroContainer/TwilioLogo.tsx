import React, { ImgHTMLAttributes } from 'react';

export default function TwilioLogo(props: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src={process.env.PUBLIC_URL + '/logo.svg'}   // or '/favicon.ico'
      width={30}
      height={30}
      alt="KMC Hospital Limited"
      {...props}
    />
  );
}