import React from 'react';
import { getHttpUrl } from '../config/defaults'
import {
  TrashIcon,
} from '@heroicons/react/24/outline';

export interface NftImage {
  uri: string
  alt?: string
  className?: string
  name?: string
  token_id?: string
  removeCallback?: Function
}

export default function NftImage({ uri, alt, className, name, token_id, removeCallback }: NftImage) {
  const imageSource = `${uri}`.search('ipfs:') > -1 ? getHttpUrl(uri) : uri

  function callback(e) {
    e.preventDefault()
    e.stopPropagation()
    if (removeCallback) removeCallback()
  }

  return (
    <div className="relative group block rounded outline outline-2 outline-pink-600 hover:outline-pink-600 outline-offset-2">
      <img src={imageSource} height="100%" width="100%" alt={alt || ''} className="rounded" />
      <div className="absolute flex justify-between transition-all opacity-0 group-hover:opacity-100 bg-black/50 text-gray-100 text-xs rounded-b left-0 right-0 bottom-0 p-2">
        {name && (
          <p>{name}</p>
        )}
        {token_id && (
          <p>#{token_id}</p>
        )}
      </div>
      {removeCallback && (
        <div onClick={callback} className="absolute transition-all opacity-0 group-hover:opacity-100 bg-black/50 text-red-500 hover:text-red-300 cursor-pointer rounded top-2 right-2 p-2">
          <TrashIcon className="w-6 h-6"/>
        </div>
      )}
    </div>
  );
}
