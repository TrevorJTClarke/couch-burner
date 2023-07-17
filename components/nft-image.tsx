import React from 'react';
import { getHttpUrl } from '../config/defaults'

export interface NftImage {
  uri: string
  alt?: string
  className?: string
}

export default function NftImage({ uri, alt, className }: NftImage) {
  const imageSource = `${uri}`.search('ipfs:') > -1 ? getHttpUrl(uri) : uri

  return (
    <div className="block rounded outline outline-2 outline-pink-600 hover:outline-pink-600 outline-offset-2">
      <img src={imageSource} height="100%" width="100%" alt={alt || ''} className="rounded" />
    </div>
  );
}
